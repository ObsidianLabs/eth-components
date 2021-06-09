import React, { PureComponent } from 'react'

import {
  Modal,
  DebouncedFormGroup,
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from '@obsidians/ui-components'

import fileOps from '@obsidians/file-ops'
import redux from '@obsidians/redux'

export default class AbiInputModal extends PureComponent {
  constructor (props) {
    super(props)
    this.modal = React.createRef()
    this.nameInput = React.createRef()

    this.state = {
      name: '',
      codeHash: '',
      codeHashEditable: true,
      abi: '',
      projectAbis: null,
      validJson: false,
    }
  }

  openModal = (name, codeHash, abi) => {
    if (name || codeHash) {
      this.setState({ name, codeHash, abi: '', codeHashEditable: !codeHash })
    } else {
      this.setState({ name: '', codeHash: '', abi: '', validJson: false, codeHashEditable: true })
    }
    if (abi) {
      this.onChangeAbi(abi)
    }
    this.refreshProjectAbis()
    this.modal.current.openModal()
    setTimeout(() => this.nameInput.current?.focus(), 100)
    return new Promise(resolve => { this.onResolve = resolve })
  }

  refreshProjectAbis = async () => {
    const projectRoot = redux.getState().projects.getIn(['selected', 'path'])
    if (!projectRoot) {
      this.setState({ projectAbis: null })
    } else {
      const { path, fs } = fileOps.current
      const contractsFolder = path.join(projectRoot, 'build', 'contracts')
      const files = await fileOps.current.listFolder(contractsFolder)
      const contracts = await Promise.all(files
        .map(f => f.name)
        .filter(name => name.endsWith('.json'))
        .map(name => path.join(contractsFolder, name))
        .map(contractPath => fs.readFile(contractPath, 'utf8')
          .then(content => ({ contractPath, contract: JSON.parse(content) }))
          .catch(() => null)
        )
      )
      const projectAbis = contracts
        .filter(Boolean)
        .map(({ contractPath, contract }) => [contractPath, { name: contract.contractName, abi: contract.abi }])
      this.setState({ projectAbis })
    }
  }

  onConfirm = () => {
    this.onResolve({
      name: this.state.name,
      codeHash: this.state.codeHash,
      abi: this.state.abi,
    })
    this.setState({ name: '', codeHash: '', abi: '', validJson: false })
    this.modal.current.closeModal()
  }

  onChangeAbi = abi => {
    try {
      JSON.parse(abi)
    } catch (e) {
      this.setState({ abi, validJson: false })
      return
    }
    this.setState({ abi, validJson: true })
  }

  renderAbiSelectionButton = () => {
    const abis = this.state.projectAbis
    if (!abis) {
      return null
    }
    return (
      <UncontrolledButtonDropdown>
        <DropdownToggle caret color='success'>
          Select from the current project
        </DropdownToggle>
        <DropdownMenu className='dropdown-menu-sm' style={{ maxHeight: 240 }}>
          {this.renderAbiDropdownItem(abis)}
        </DropdownMenu>
      </UncontrolledButtonDropdown>
    )
  }

  renderAbiDropdownItem = abis => {
    if (!abis) {
      return null
    }
    return abis.map(abiItem => {
      const [filePath, abiObj] = abiItem
      return (
        <DropdownItem
          key={filePath}
          onClick={() => {
            this.setState({ name: abiObj.name })
            this.onChangeAbi(JSON.stringify(abiObj.abi, null, 2))
          }}
        >
          <b>{abiObj.name}</b>
          <div className='text-muted small'><code>{filePath}</code></div>
        </DropdownItem>
      )
    })
  }

  render () {
    const { name, codeHash, codeHashEditable, validJson } = this.state
    return (
      <Modal
        ref={this.modal}
        h100
        title='Enter New ABI'
        ActionBtn={this.renderAbiSelectionButton()}
        onConfirm={this.onConfirm}
        confirmDisabled={!name || !codeHash || !validJson}
      >
        <DebouncedFormGroup
          ref={this.nameInput}
          label='Name'
          value={name}
          onChange={name => this.setState({ name })}
        />
        <DebouncedFormGroup
          label='Code hash / Address'
          value={codeHash}
          onChange={codeHash => this.setState({ codeHash })}
          disabled={!codeHashEditable}
        />
        <DebouncedFormGroup
          size='sm'
          label='ABI'
          type='textarea'
          placeholder='Please enter the ABI object. Must be a valid JSON array.'
          formGroupClassName='d-flex flex-column flex-grow-1 code'
          inputGroupClassName='flex-grow-1'
          className='h-100 code'
          value={this.state.abi}
          onChange={this.onChangeAbi}
        />
      </Modal>
    )
  }
}
