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
    this.state = {
      info: { url: '' },
    }
    this.modal = React.createRef()
  }

  openModal (customNetwork = {}) {
    this.setState({ info: customNetwork })
    this.modal.current?.openModal()
  }

  update (customNetwork) {
    this.setState({ info: customNetwork })
    this.tryCreateSdk(customNetwork)
  }

  tryCreateSdk = async ({ url }) => {
    const status = await networkManager.updateCustomNetwork({ url })
    return !!status
  }

  onConfirmCustomNetwork = async () => {
    const valid = await this.tryCreateSdk(this.state.info)
    if (!valid) {
      return
    }
    redux.dispatch('UPDATE_GLOBAL_CONFIG', { customNetwork: this.state.info })
    this.modal.current.closeModal()
    this.props.onUpdate(this.state.info)
  }

  render () {
    const { info } = this.state

    return (
      <Modal
        ref={this.modal}
        title='Custom Network'
        onConfirm={this.onConfirmCustomNetwork}
      >
        <DebouncedFormGroup
          label='URL of node rpc'
          placeholder='http(s)://...'
          maxLength='300'
          value={info.url}
          onChange={url => this.setState({ info: { url } })}
        />
      </Modal>
    )
  }
}
