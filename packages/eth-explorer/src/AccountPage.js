import React, { PureComponent } from 'react'

import { Screen, LoadingScreen, ErrorPage } from '@obsidians/ui-components'

import redux from '@obsidians/redux'
import { networkManager, utils } from '@obsidians/eth-network'
import { t } from '@obsidians/i18n'

import AccountBalance from './AccountBalance'
import AccountInfo from './AccountInfo'
import AccountTransactions from './AccountTransactions'

let currentNetId = null
export default class AccountPage extends PureComponent {
  state = {
    error: null,
    account: null,
    tokens: [],
    tokenInfo: null,
    loading: true
  }

  constructor (props) {
    super(props)
    this.accountTransactions = React.createRef()
    props.cacheLifecycles.didRecover(this.componentDidRecover)

    this.delayUpdate = this.delayUpdate.bind(this)
  }

  async componentDidMount() {
    this.props.onDisplay(this)
    this.refresh()
  }

  delayUpdate() {
    let updateCount = 5
    const delayFunc = async (func = delayFunc, delayTime = 500 * (6 - updateCount) ) => {
      if (updateCount === 0) return
      updateCount--
      const account = await networkManager.sdk.accountFrom(this.props.value)
      const needUpdate = !!account && this.state?.account?.balance !== account?.balance
      needUpdate && this.setState({ account })
      setTimeout(func, delayTime)
    }

    delayFunc()
  }

  componentDidUpdate(newProps) {
    if (newProps.network && newProps.network !== currentNetId) {
      currentNetId = newProps.network
      this.delayUpdate()
    }
  }

  componentDidRecover = () => {
    this.props.onDisplay(this)
  }

  refresh = async () => {
    this.setState({ loading: true })

    await new Promise(resolve => setTimeout(resolve, 10))

    const value = this.props.value

    if (!value) {
      this.setState({ loading: false, error: null, account: null })
      return
    }

    if (!await networkManager.sdk?.isValidAddress(value)) {
      this.setState({ loading: false, error: true, account: null })
      return
    }

    let account
    try {
      account = await networkManager.sdk.accountFrom(value)
      this.getTokenInfo(account)
      this.setState({ loading: false, error: null, account })
    } catch (e) {
      console.error(e)
      this.setState({ loading: false, error: e.message, account: null })
    }
  }

  getTokenInfo = account => {
    networkManager.sdk.getTokens(account.address).then(tokens => {
      this.setState({ tokens })
    })

    if (!account.codeHash) {
      this.setState({ tokenInfo: null })
      return
    }

    networkManager.sdk.getTokenInfo(account.address).then(tokenInfo => {
      this.setState({ tokenInfo })
      if (tokenInfo?.type === 'ERC20') {
        redux.dispatch('ADD_TOKEN_INFO', {
          network: networkManager.networkId,
          address: account.address,
          tokenInfo,
        })
      } else {
        redux.dispatch('REMOVE_TOKEN_INFO', {
          network: networkManager.networkId,
          address: account.address,
        })
      }
    })
  }

  handleReconnectNetwork = () => {
    redux.dispatch('CHANGE_NETWORK_STATUS', false)
    redux.dispatch('SELECT_NETWORK', '')
    networkManager.reconnectNetwork()
    this.props.onRefresh()
  }

  render () {
    const { AccountInfo, history } = this.props
    const { error, account, tokens, tokenInfo } = this.state

    if (!networkManager.sdk) {
      return null
    }

    if (!this.props.value) {
      return (
        <Screen>
          <h4 className='display-4'>{t('explorer.page.newPage')}</h4>
          <p className='lead'>{t('explorer.page.newPageText', { chainName: process.env.CHAIN_NAME })}</p>
        </Screen>
      )
    }

    if (this.state.loading) {
      return <LoadingScreen />
    }

    if (error) {
      if (typeof error === 'string') {
        let errorTit = 'Error'
        if (utils.isNetworkConnectError(error)) errorTit = t('network.network.error')
        if (utils.isJsonRPCError(error)) errorTit = 'Network Unstable'
        let description = error
        if (utils.isNetworkConnectError(error)) description = t('network.network.errorDesc')
        if (utils.isJsonRPCError(error)) description = 'Please reconnect this network in Black IDE.'
        return (
          <Screen>
            <ErrorPage
              btnText={t('network.network.reconnect')}
              btnClick={this.handleReconnectNetwork}
              btnStatus={!(utils.isNetworkConnectError(error) || utils.isJsonRPCError(error))}
              title={errorTit}
              divider={utils.isJsonRPCError(error) && false}
              description={description}
            />
          </Screen>
        )
      } else {
        return (
          <Screen>
            <h4 className='display-4'>{t('explorer.page.invalidAddress')}</h4>
            <p className='lead'><kbd>{this.props.value}</kbd></p>
          </Screen>
        )
      }
    }

    if (!account) {
      return null
    }

    return (
      <div className='d-flex flex-1 flex-column overflow-auto' key={account.address}>
        <div className='d-flex'>
          <div className='col-4 p-0 border-right-black'>
            <AccountBalance account={account} tokens={tokens} history={history} />
          </div>
          <div className='col-8 p-0 overflow-auto' style={{ maxHeight: 250 }}>
            <AccountInfo account={account} tokenInfo={tokenInfo} />
          </div>
        </div>
        <div className='d-flex flex-fill overflow-hidden'>
          <div className='col-12 p-0 border-top-black overflow-auto'>
            <AccountTransactions account={account} ref={this.accountTransactions}/>
          </div>
        </div>
      </div>
    )
  }
}

AccountPage.defaultProps = {
  AccountInfo,
}