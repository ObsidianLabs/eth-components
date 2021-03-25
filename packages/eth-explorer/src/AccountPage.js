import React, { PureComponent } from 'react'

import {
  Screen,
  LoadingScreen,
} from '@obsidians/ui-components'
import { t } from '@obsidians/i18n'

import { networkManager } from '@obsidians/eth-network'

import AccountBalance from './AccountBalance'
import AccountInfo from './AccountInfo'
import AccountTransactions from './AccountTransactions'

export default class AccountPage extends PureComponent {
  state = {
    error: null,
    account: null,
    loading: true,
  }

  constructor (props) {
    super(props)
    this.accountTransactions = React.createRef()
    props.cacheLifecycles.didRecover(this.componentDidRecover)
  }

  componentDidMount () {
    this.props.onDisplay(this)
    this.refresh()
  }

  componentDidUpdate (prevProps) {
    if (prevProps.value !== this.props.value) {
      this.refresh()
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
      account.count = await networkManager.sdk.getTransactionsCount(value)
      this.setState({ loading: false, error: null, account })
      this.forceUpdate()
    } catch (e) {
      this.setState({ loading: false, error: e.message, account: null })
      return
    }
  }

  render () {
    const { AccountInfo } = this.props
    const { error, account } = this.state

    if (!networkManager.sdk) {
      return null
    }

    if (!this.props.value) {
      return (
        <Screen>
          <h4 className='display-4'>{t('explorer.newPage')}</h4>
          <p className='lead'>{t('explorer.enterAddress', { chain: process.env.CHAIN_NAME })}</p>
        </Screen>
      )
    }

    if (this.state.loading) {
      return <LoadingScreen />
    }

    if (error) {
      return (
        <Screen>
          <h4 className='display-4'>{t('explorer.error.invalidAddress')}</h4>
          <p>{error}</p>
          <p className='lead'><kbd>{this.props.value}</kbd></p>
        </Screen>
      )
    }

    if (!account) {
      return null
    }

    return (
      <div className='d-flex flex-1 flex-column overflow-auto' key={account.address}>
        <div className='d-flex'>
          <div className='col-4 p-0 border-right-black'>
            <AccountBalance account={account} />
          </div>
          <div className='col-8 p-0 overflow-auto' style={{ maxHeight: 250 }}>
            <AccountInfo account={account} />
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