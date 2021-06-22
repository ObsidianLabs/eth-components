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
import fileOps from '@obsidians/file-ops'
import redux from '@obsidians/redux'
import { BaseProjectManager } from '@obsidians/workspace'

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
      projectAbis: null,
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
    if (prevProps.projectRoot !== this.props.projectRoot) {
      this.refreshProjectAbis()
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
      this.setState({ loading: false, error: 'No address entered.' })
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
      this.setState({ loading: false, error: 'No contract deployed.' })
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

    this.refreshProjectAbis()

    this.setState({
      loading: false,
      error: <span>No ABI for code hash <code>{account.codeHash}</code>.</span>,
      errorType: 'ABI_NOT_FOUND',
      abis: Object.entries(redux.getState().abis.toJS()),
    })
  }

  refreshProjectAbis = async () => {
    const projectRoot = this.props.projectRoot
    if (!projectRoot || !BaseProjectManager.instance) {
      this.setState({ projectAbis: null })
    } else {
      const { path, fs } = fileOps.current
      const contractsFolder = BaseProjectManager.instance.pathForProjectFile('build/contracts')
      const files = await fileOps.current.listFolder(contractsFolder)
      const contracts = await Promise.all(files
        .map(f => f.name)
        .filter(name => name.endsWith('.json'))
        .map(name => path.join(contractsFolder, name))
        .map(contractPath => fs.readFile(contractPath, 'utf8')
          .then(content => ({
            contractPath,
            pathInProject: BaseProjectManager.instance.pathInProject(contractPath),
            contract: JSON.parse(content)
          }))
          .catch(() => null)
        )
      )
      const projectAbis = contracts
        .filter(Boolean)
        .map(({ contractPath, pathInProject, contract }) => {
          const contractName = contract.contractName || fileOps.current.path.parse(contractPath).name
          return [pathInProject || contractPath, { name: contractName, abi: contract.abi }]
        })
      this.setState({ projectAbis })
    }
  }

  getAbiData (codeHash) {
    const abiData = redux.getState().abis.get(codeHash)?.toJS()
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

  renderAbiDropdownItem = abis => {
    if (!abis) {
      return null
    }
    if (!abis.length) {
      return <DropdownItem disabled>(No ABI found)</DropdownItem>
    }
    return abis.map(abiItem => {
      const [codeHash, abiObj] = abiItem
      let abi
      try {
        abi = typeof abiObj.abi === 'string' ? JSON.parse(abiObj.abi) : abiObj.abi
      } catch (error) {}
      return (
        <DropdownItem
          key={codeHash}
          onClick={() => this.setState({ abi: { abi }, error: null })}
        >
          <b>{abiObj.name}</b>
          <div className='text-muted small'><code>{codeHash}</code></div>
        </DropdownItem>
      )
    })
  }

  renderAbisFromProject = () => {
    const abis = this.state.projectAbis
    if (!abis) {
      return null
    }

    return (
      <UncontrolledButtonDropdown className='mr-2 mb-2'>
        <DropdownToggle color='primary' caret>
          Select from the current project
        </DropdownToggle>
        <DropdownMenu className='dropdown-menu-sm' style={{ maxHeight: 240 }}>
          {this.renderAbiDropdownItem(abis)}
        </DropdownMenu>
      </UncontrolledButtonDropdown>
    )
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
            <div className='d-flex flex-wrap align-items-start'>
              <UncontrolledButtonDropdown className='mr-2 mb-2'>
                <DropdownToggle color='primary' caret>
                  Select from <b>ABI Storage</b>
                </DropdownToggle>
                <DropdownMenu className='dropdown-menu-sm' style={{ maxHeight: 240 }}>
                  {/* <DropdownItem header>ABIs</DropdownItem> */}
                  {this.renderAbiDropdownItem(this.state.abis)}
                </DropdownMenu>
              </UncontrolledButtonDropdown>
              {this.renderAbisFromProject()}
              <Button color='primary' onClick={() => this.openAbiStorageModal(account.codeHash)}>
                Add ABI for code hash <small><code>{account.codeHash.substr(0, 6)}...{account.codeHash.substr(-4)}</code></small>
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

    const contractInstance = networkManager.sdk.contractFrom({ ...abi, address: value })
    const functions = abi.abi.filter(item => item.type === 'function')
    const events = abi.abi.filter(item => item.type === 'event')
    const actions = functions.filter(item => ['view', 'pure'].indexOf(item.stateMutability) === -1)
    const views = functions.filter(item => ['view', 'pure'].indexOf(item.stateMutability) > -1)

    return (
      <div className='d-flex p-relative h-100 w-100'>
        <SplitPane
          split='vertical'
          defaultSize={320}
          minSize={200}
        >
          <ContractActions
            value={value}
            actions={actions}
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
              actions={views}
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
