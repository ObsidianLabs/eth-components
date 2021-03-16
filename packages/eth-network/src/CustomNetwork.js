import React, { PureComponent } from 'react'

import {
  Modal,
  DebouncedFormGroup,
  IconButton,
} from '@obsidians/ui-components'

import redux from '@obsidians/redux'

import networkManager from './networkManager'

export default class CustomNetwork extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      info: { url: '', option: '' },
    }
    this.modal = React.createRef()
  }

  componentDidMount () {
    if (!this.props.customNetwork) {
      this.modal.current.openModal()
    } else {
      this.setState({ info: this.props.customNetwork })
      this.tryCreateSdk(this.props.customNetwork)
    }
  }

  tryCreateSdk = async ({ url, option }) => {
    const status = await networkManager.updateCustomNetwork({ url, option })
    return !!status
  }

  onConfirmCustomNetwork = async () => {
    const valid = await this.tryCreateSdk(this.state.info)

    if (!valid) {
      return
    }

    redux.dispatch('UPDATE_GLOBAL_CONFIG', { customNetwork: this.state.info })
    this.modal.current.closeModal()
  }

  render () {
    const { networkId, RemoteNetwork } = this.props
    const { info } = this.state

    return <>
      <RemoteNetwork
        networkId={networkId}
        info={info}
        EditButton={
          <IconButton
            color='default'
            className='text-muted'
            icon='fas fa-cog'
            onClick={() => this.modal.current.openModal()}
          />
        }
      />
      <Modal
        ref={this.modal}
        title='Custom Network'
        onConfirm={this.onConfirmCustomNetwork}
      >
        <DebouncedFormGroup
          label='Node URL'
          placeholder='grpc://... or http(s)://...'
          maxLength='300'
          value={info.url}
          onChange={url => this.setState({ info: { ...info, url } })}
        />
        <DebouncedFormGroup
          label='Option'
          type='textarea'
          placeholder='Must be a valid JSON string'
          inputGroupClassName='code'
          height={300}
          value={info.option}
          onChange={option => this.setState({ info: { ...info, option } })}
        />
      </Modal>
    </>
  }
}
