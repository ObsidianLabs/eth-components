import React, { PureComponent } from 'react'

import {
  Screen,
  SplitPane,
  LoadingScreen,
  Button,
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from '@obsidians/ui-components'
import { t } from '@obsidians/i18n'

import { networkManager } from '@obsidians/eth-network'
import redux from '@obsidians/redux'

import ContractActions from './ContractActions'
import ContractViews from './ContractViews'
import ContractEvents from './ContractEvents'
import AbiStorageModal from './AbiStorage/AbiStorageModal'

export default class ContractPage extends PureComponent {
  constructor (props) {
    super(props)
    this.abiStorageModal = React.createRef()

    this.state = {
      error: null,
      errorType: null,
      abi: {},
      abis: [],
      selectedAbi: null,
      account: null,
      loading: true,
    }
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
    this.setState({ loading: true, error: null, abi: {}, abis: [], selectedAbi: null, account: null, errorType: null })

    await new Promise(resolve => setTimeout(resolve, 10))

    const value = this.props.value

    if (!value) {
      this.setState({ loading: false, error: t('contract.error.noAddressEntered') })
      return
    }

    try {
      const abiData = this.getAbiData(value)
      if (abiData) {
        this.setState({ loading: false, abi: abiData })
        return
      }
    } catch (e) {
      this.setState({ loading: false, error: e.message })
    }

    let account
    try {
      account = await networkManager.sdk.accountFrom(value)
      this.setState({ account })
    } catch (e) {
      this.setState({ loading: false, error: e.message })
      return
    }

    if (account.codeHash === '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470') {
      this.setState({ loading: false, error: t('contract.error.noContractDeployed') })
      return
    }

    try {
      const abiData = this.getAbiData(account.codeHash)
      if (abiData) {
        this.setState({ loading: false, abi: abiData })
        return
      }
    } catch (e) {
      this.setState({ loading: false, error: e.message })
    }

    this.setState({
      loading: false,
      error: <span>{t('contract.error.noAbiFor')} <code>{account.codeHash}</code>.</span>,
      errorType: 'ABI_NOT_FOUND',
      abis: redux.getState().abis.toArray(),
    })
  }

  getAbiData (codeHash) {
    const abiData = redux.getState().abis.get(codeHash).toJS()
    if (!abiData) {
      return
    }
    try {
      abiData.abi = JSON.parse(abiData.abi)
    } catch {
      throw new Error('Invalid ABI structure.')
    }
    return abiData
  }

  async openAbiStorageModal (codeHash) {
    await this.abiStorageModal.current.newAbi('', codeHash)
    this.refresh()
  }

  renderABIDropdownItem () {
    return this.state.abis.map(abiItem => {
      const [codeHash, abiObj] = abiItem
      let abi
      try {
        abi = JSON.parse(abiObj.get('abi'))
      } catch (error) {}
      return (
        <DropdownItem
          key={codeHash}
          onClick={() => this.setState({ abi: { abi }, error: null })}
        >
          <b>{abiObj.get('name')}</b> - <small><code>{codeHash}</code></small>
        </DropdownItem>
      )
    })
  }

  render () {
    const { value, signer } = this.props
    const { error, abi, account, errorType } = this.state

    if (!networkManager.sdk) {
      return null
    }

    if (!value) {
      return (
        <Screen>
          <h4 className='display-4'>{t('contract.newPage')}</h4>
          <p className='lead'>{t('contract.enterAddress', { chain: process.env.CHAIN_NAME })}</p>
        </Screen>
      )
    }

    if (this.state.loading) {
      return <LoadingScreen />
    }

    if (error) {
      if (account && errorType && errorType === 'ABI_NOT_FOUND') {
        return (
          <Screen>
            <h4 className='display-4'>{t('contract.error.abiNotFound')}</h4>
            <p>{t('contract.error.abiNotFoundMessagePre')} <kbd>{account.address}</kbd> {t('contract.error.abiNotFoundMessagePost')} <kbd>{account.codeHash}</kbd></p>
            <hr />
            <div className='flex'>
              <UncontrolledButtonDropdown>
                <DropdownToggle color='primary' caret>
                  {t('contract.selectExistingAbi')}
                </DropdownToggle>
                <DropdownMenu>
                  <DropdownItem header>ABIs</DropdownItem>
                  {this.renderABIDropdownItem()}
                </DropdownMenu>
              </UncontrolledButtonDropdown>
              <Button
                color='primary'
                style={{ marginLeft: '15px', height: '36px' }}
                onClick={() => this.openAbiStorageModal(account.codeHash)}
              >
                {t('contract.addAbiFor')} <code>{account.codeHash.substr(0, 4)}...{account.codeHash.substr(account.codeHash.length - 4, account.codeHash.length)}</code>
              </Button>
            </div>
            <AbiStorageModal ref={this.abiStorageModal}/>
          </Screen>
        )
      }
      return (
        <Screen>
          <h4 className='display-4'>{t('error')}</h4>
          <p>{error}</p>
        </Screen>
      )
    }

    const contractInstance = networkManager.sdk.contractFrom({ ...abi, address: value })
    const functions = abi.abi.filter(item => item.type === 'function')
    const events = abi.abi.filter(item => item.type === 'event')
    const actions = functions.filter(item => item.stateMutability !== 'view' && item.stateMutability !== 'pure')
    const views = functions.filter(item => item.stateMutability === 'view' || item.stateMutability === 'pure')

    return (
      <div className='d-flex p-relative h-100 w-100'>
        <SplitPane
          split='vertical'
          defaultSize={320}
          minSize={200}
        >
          <ContractActions
            value={value}
            abi={actions}
            contract={contractInstance}
            signer={signer}
            // network={network}
            // history={contractCalls.getIn(['action', 'history'])}
            // bookmarks={contractCalls.getIn(['action', 'bookmarks'])}
          />
          <SplitPane
            split='vertical'
            defaultSize={320}
            minSize={200}
          >
            <ContractViews
              value={value}
              abi={views}
              contract={contractInstance}
              // network={network}
              // history={contractCalls.getIn(['table', 'history'])}
              // bookmarks={contractCalls.getIn(['table', 'bookmarks'])}
            />
            <ContractEvents
              value={value}
              abi={events}
              contract={contractInstance}
            />
          </SplitPane>
        </SplitPane>
      </div>
    )
  }
}
