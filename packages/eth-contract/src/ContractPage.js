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

import { networkManager } from '@obsidians/eth-network'
import redux from '@obsidians/redux'

import ContractActions from './ContractActions'
import ContractTable from './ContractTable'
import ContractEvents from './ContractEvents'
import AbiStorageModal from './AbiStorage/AbiStorageModal'

export default class ContractPage extends PureComponent {
  constructor (props) {
    super(props)
    this.abiStorageModal = React.createRef()

    this.state = {
      error: null,
      errorType: null,
      abi: null,
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
    this.setState({ loading: true, error: null, abi: null, abis: [], selectedAbi: null, account: null, errorType: null })

    await new Promise(resolve => setTimeout(resolve, 10))

    const value = this.props.value

    if (!value) {
      this.setState({ loading: false, error: 'No address entered.' })
      return
    }

    let abi = redux.getState().abis.getIn([value, 'abi'])
    if (abi) {
      try {
        this.setState({ loading: false, abi: JSON.parse(abi) })
      } catch (e) {
        this.setState({ loading: false, error: 'Invalid ABI structure.' })
      }
      return
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
      this.setState({ loading: false, error: 'No contract deployed.' })
      return
    }

    abi = redux.getState().abis.getIn([account.codeHash, 'abi'])
    if (!abi) {
      this.setState({
        loading: false,
        error: <span>No ABI for code hash <code>{account.codeHash}</code>.</span>,
        errorType: 'ABI_NOT_FOUND',
        abis: redux.getState().abis.toArray(),
      })
      return
    }

    try {
      this.setState({ loading: false, abi: JSON.parse(abi) })
    } catch (e) {
      this.setState({ loading: false, error: 'Invalid ABI structure.' })
    }
  }

  async openAbiStorageModal (codeHash) {
    await this.abiStorageModal.current.newAbi('', codeHash)
    this.refresh()
  }

  renderContractActions (value, abi, contract, signer) {
    if (!abi.length) {
      return (
        <Screen>
          <p>No actions found</p>
        </Screen>
      )
    }
    return (
      <ContractActions
        // network={network}
        value={value}
        abi={abi}
        contract={contract}
        signer={signer}
        // contract={contract}
        // abi={this.state.abi}
        // history={contractCalls.getIn(['action', 'history'])}
        // bookmarks={contractCalls.getIn(['action', 'bookmarks'])}
      />
    )
  }

  renderContractViews (value, abi, contract) {
    if (!abi.length) {
      return (
        <Screen>
          <p>No views found</p>
        </Screen>
      )
    }
    return (
      <ContractTable
        value={value}
        abi={abi}
        contract={contract}
      // network={network}
      // contract={contract}
      // abi={this.state.abi}
      // history={contractCalls.getIn(['table', 'history'])}
      // bookmarks={contractCalls.getIn(['table', 'bookmarks'])}
      />
    )
  }

  renderContractEvents (value, abi, contract) {
    if (!abi.length) {
      return (
        <Screen>
          <p>No events found</p>
        </Screen>
      )
    }
    return (
      <ContractEvents
        value={value}
        abi={abi}
        contract={contract}
      />
    )
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
          onClick={() => this.setState({ abi, error: null })}
        >
          <b>{abiObj.get('name')}</b> - <small><code>{codeHash}</code></small>
        </DropdownItem>
      )
    })
  }

  render () {
    const { signer } = this.props
    const { error, abi, account, errorType } = this.state

    if (!networkManager.sdk) {
      return null
    }

    if (!this.props.value) {
      return (
        <Screen>
          <h4 className='display-4'>New Page</h4>
          <p className='lead'>Please enter an {process.env.CHAIN_NAME} address.</p>
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
            <h4 className='display-4'>ABI Not Found</h4>
            <p>There is no associated ABI for the current contract at <kbd>{account.address}</kbd> with code hash <kbd>{account.codeHash}</kbd></p>
            <hr />
            <div className='flex'>
              <UncontrolledButtonDropdown>
                <DropdownToggle color='primary' caret>
                  Select an existing ABI
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
                Add ABI for code hash <code>{account.codeHash.substr(0, 4)}...{account.codeHash.substr(account.codeHash.length - 4, account.codeHash.length)}</code>
              </Button>
            </div>
            <AbiStorageModal ref={this.abiStorageModal}/>
          </Screen>
        )
      }
      return (
        <Screen>
          <h4 className='display-4'>Error</h4>
          <p>{error}</p>
        </Screen>
      )
    }

    const contractInstance = networkManager.sdk.contractFrom({ abi, address: this.props.value })
    const functions = abi.filter(item => item.type === 'function')
    const events = abi.filter(item => item.type === 'event')
    const actions = functions.filter(item => item.stateMutability !== 'view' && item.stateMutability !== 'pure')
    const views = functions.filter(item => item.stateMutability === 'view' || item.stateMutability === 'pure')

    return (
      <div className='d-flex p-relative h-100 w-100'>
        <SplitPane
          split='vertical'
          defaultSize={320}
          minSize={200}
        >
          {this.renderContractActions(this.props.value, actions, contractInstance, signer)}
          <SplitPane
            split='vertical'
            defaultSize={320}
            minSize={200}
          >
            {this.renderContractViews(this.props.value, views, contractInstance)}
            {this.renderContractEvents(this.props.value, events, contractInstance)}
          </SplitPane>
        </SplitPane>
      </div>
    )
  }
}
