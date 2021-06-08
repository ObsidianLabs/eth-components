import React, { PureComponent } from 'react'

import {
  Modal,
  DebouncedFormGroup,
} from '@obsidians/ui-components'

import redux from '@obsidians/redux'

import networkManager from '../networkManager'

export default class CustomNetworkModal extends PureComponent {
  constructor (props) {
    super(props)
    this.state = { ...props.customNetwork }
    this.modal = React.createRef()
  }

  openModal (customNetwork = {}) {
    this.setState({ ...customNetwork })
    this.modal.current?.openModal()
  }

  update (customNetwork) {
    this.setState({ ...customNetwork })
    this.tryCreateSdk(customNetwork)
  }

  tryCreateSdk = async customNetwork => {
    const status = await networkManager.updateCustomNetwork(customNetwork)
    return !!status
  }

  onConfirmCustomNetwork = async () => {
    const customNetwork = { ...this.state }
    const valid = await this.tryCreateSdk(customNetwork)
    if (!valid) {
      return
    }
    redux.dispatch('UPDATE_GLOBAL_CONFIG', { customNetwork })
    this.modal.current.closeModal()
  }

  render () {
    const {
      placeholder = 'http(s)://...',
    } = this.props
    const { url } = this.state

    return (
      <Modal
        ref={this.modal}
        title='Custom Network'
        onConfirm={this.onConfirmCustomNetwork}
      >
        <DebouncedFormGroup
          label='URL of node rpc'
          placeholder={placeholder}
          maxLength='300'
          value={url}
          onChange={url => this.setState({ url })}
        />
      </Modal>
    )
  }
}
