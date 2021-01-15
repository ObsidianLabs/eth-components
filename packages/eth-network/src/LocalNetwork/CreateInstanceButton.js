import React, { PureComponent } from 'react'

import {
  Button,
  Modal,
  DebouncedFormGroup,
} from '@obsidians/ui-components'

import keypairManager, { KeypairInputSelector } from '@obsidians/keypair'
import { DockerImageInputSelector } from '@obsidians/docker'
import notification from '@obsidians/notification'

import instanceChannel from './instanceChannel'

export default class CreateInstanceButton extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      name: '',
      version: '',
      miner: '',
      pending: false,
    }

    this.modal = React.createRef()
  }

  onClickButton = () => {
    this.modal.current.openModal()
  }

  onCreateInstance = async () => {
    let keys
    let miner
    if (this.props.minerKey) {
      const keypairs = await keypairManager.loadAllKeypairs()
  
      if (!keypairs || !keypairs.length) {
        notification.error('Failed', 'Please create or import a keypair in the keypair manager first.')
        return
      }
      keys = await Promise.all(keypairs.map(k => keypairManager.getSecret(k.address)))

      const secret = await keypairManager.getSecret(this.state.miner)
      miner = { address: this.state.miner, secret }
    }

    this.setState({ pending: 'Creating...' })

    await instanceChannel.invoke('create', {
      name: this.state.name,
      version: this.state.version,
      networkId: this.props.networkId,
      miner,
      keys,
    })
    this.modal.current.closeModal()
    this.setState({ pending: false })
    this.props.onRefresh()
  }

  renderMinerInput = () => {
    if (this.props.minerKey) {
      return (
        <KeypairInputSelector
          label='Miner'
          value={this.state.miner}
          onChange={miner => this.setState({ miner })}
        />
      )
    }
    return null
  }

  render () {
    return (
      <>
        <Button
          key='new-instance'
          color='success'
          className={this.props.className}
          onClick={this.onClickButton}
        >
          <i className='fas fa-plus mr-1' />
          New Instance
        </Button>
        <Modal
          ref={this.modal}
          overflow
          title={`New Instance (${this.props.networkId})`}
          textConfirm='Create'
          onConfirm={this.onCreateInstance}
          pending={this.state.pending}
          confirmDisabled={!this.state.name || !this.state.version}
        >
          <DebouncedFormGroup
            label='Instance name'
            placeholder='Can only contain alphanumeric characters, dots, hyphens or underscores.'
            maxLength='50'
            value={this.state.name}
            onChange={name => this.setState({ name })}
          />
          <DockerImageInputSelector
            channel={instanceChannel.node}
            label={`${process.env.CHAIN_EXECUTABLE_NAME_IN_LABEL} version`}
            noneName={process.env.CHAIN_EXECUTABLE_NAME_IN_LABEL}
            modalTitle={`${process.env.CHAIN_EXECUTABLE_NAME} Version Manager`}
            downloadingTitle={`Downloading ${process.env.CHAIN_EXECUTABLE_NAME}`}
            selected={this.state.version}
            onSelected={version => this.setState({ version })}
          />
          {this.renderMinerInput()}
        </Modal>
      </>
    )
  }
}
