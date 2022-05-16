import React, { PureComponent } from 'react'
import notification from '@obsidians/notification'

import {
  Modal,
  DebouncedFormGroup,
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from '@obsidians/ui-components'

import { BaseProjectManager } from '@obsidians/workspace'
import { utils } from '@obsidians/sdk'
import { t } from '@obsidians/i18n'

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
      this.setState({ name, codeHash: utils.isValidAddressReturn(codeHash), abi: '', codeHashEditable: !codeHash })
    } else {
      this.setState({ name: '', codeHash: '', abi: '', validJson: false, codeHashEditable: true })
    }
    if (abi) {
      this.onChangeAbi(abi)
    }
    this.loadProjectAbis()
    this.modal.current.openModal()
    setTimeout(() => this.nameInput.current?.focus(), 100)
    return new Promise(resolve => { this.onResolve = resolve })
  }

  loadProjectAbis = async () => {
    const projectAbis = await BaseProjectManager.instance?.readProjectAbis()
    this.setState({
      projectAbis: projectAbis?.map(item => ({ ...item, id: item.pathInProject || item.contractPath }))
    })
  }

  onConfirm = () => {
    this.onResolve({
      name: this.state.name,
      codeHash: this.state.codeHash.toLowerCase(),
      abi: this.state.abi,
    })
    this.setState({ name: '', codeHash: '', abi: '', validJson: false })
    this.modal.current.closeModal()
  }

  onChangeAbi = abi => {

    try {
      let objectAbi = JSON.parse(abi)
      // for built contract
      if (objectAbi.abi && objectAbi.abi instanceof Array) {
        this.setState({ abi: JSON.stringify(objectAbi.abi), validJson: true })
        return
      } 
      if (!(objectAbi instanceof Array)) throw new Error()
    } catch (e) {
      if (!this.state.abi) notification.error(t('abi.invalid'), t('abi.invalidText'))
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
          {t('abi.selectProject')}
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
    return abis.map(item => {
      return (
        <DropdownItem
          key={item.id}
          onClick={() => {
            this.setState({ name: item.name })
            this.onChangeAbi(JSON.stringify(item.abi, null, 2))
          }}
        >
          <b>{item.name}</b>
          <div className='text-muted small'><code>{item.id}</code></div>
        </DropdownItem>
      )
    })
  }

  render () {
    const { name, codeHash, codeHashEditable, validJson } = this.state
    return (
      <Modal
        ref={this.modal}
        title={t('abi.enterNew')}
        ActionBtn={this.renderAbiSelectionButton()}
        onConfirm={this.onConfirm}
        confirmDisabled={!name || !codeHash || !validJson}
      >
        <DebouncedFormGroup
          ref={this.nameInput}
          label={t('abi.name')}
          value={name}
          onChange={name => this.setState({ name })}
        />
        <DebouncedFormGroup
          label={`${t('abi.codeHash')} / ${t('abi.address')}`}
          value={codeHash}
          onChange={codeHash => this.setState({ codeHash: utils.isValidAddressReturn(codeHash) })}
          // disabled={!codeHashEditable}
        />
        <DebouncedFormGroup
          size='sm'
          rows='12'
          label='ABI'
          type='textarea'
          importFromFile='.json'
          placeholder={t('abi.inputPlaceholder')}
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
