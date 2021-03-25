import React, { PureComponent } from 'react'

import {
  Modal,
  DebouncedFormGroup,
} from '@obsidians/ui-components'
import { t } from '@obsidians/i18n'


export default class AbiInputModal extends PureComponent {
  constructor (props) {
    super(props)
    this.modal = React.createRef()
    this.nameInput = React.createRef()

    this.state = {
      name: '',
      codeHash: '',
      abi: '',
      validJson: false,
    }
  }

  openModal = (name, codeHash, abi) => {
    if (name || codeHash) {
      this.setState({ name, codeHash })
    }
    if (abi) {
      this.onChangeAbi(abi)
    }
    this.modal.current.openModal()
    setTimeout(() => this.nameInput.current.focus(), 100)
    return new Promise(resolve => { this.onResolve = resolve })
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

  render () {
    const { name, codeHash, validJson } = this.state
    return (
      <Modal
        ref={this.modal}
        h100
        title={t('contract.abi.new')}
        onConfirm={this.onConfirm}
        confirmDisabled={!name || !codeHash || !validJson}
      >
        <DebouncedFormGroup
          ref={this.nameInput}
          label={t('contract.abi.name')}
          value={name}
          onChange={name => this.setState({ name })}
        />
        <DebouncedFormGroup
          label={t('contract.abi.address')}
          value={codeHash}
          onChange={codeHash => this.setState({ codeHash })}
        />
        <DebouncedFormGroup
          size='sm'
          label='ABI'
          type='textarea'
          placeholder={t('contract.abi.placeholder')}
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
