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
import networkManager from '../networkManager'
import { t } from '@obsidians/i18n'

export default class CreateInstanceButton extends PureComponent {
  constructor (props) {
    super(props)

    this.state = {
      name: '',
      version: '',
      miner: '',
      pending: false,
      invalid: true,
    }

    this.modal = React.createRef()
  }

  onClickButton = () => {
    this.modal.current.openModal()
  }

  onCreateInstance = async () => {
    if(this.state.invalid) {
      return
    }

    let keys
    let miner

    if (this.props.instances.some(instance => instance.Name.substr(process.env.PROJECT.length + 1) === this.state.name)) {
      notification.error(t('network.dev.fail'), t('network.dev.failText', {name: this.state.name}))
      return
    }

    const keypairs = await keypairManager.loadAllKeypairs()
    if (this.props.minerKey) {
      if (!keypairs || !keypairs.length) {
        notification.error(t('network.dev.fail'), t('network.dev.failedText'))
        return
      }
      const kp = networkManager.Sdk?.kp
      if (kp) {
        keys = await Promise.all(keypairs.filter(k => k.address.startsWith('0x')).map(async k => {
          const secret = await keypairManager.getSecret(k.address)
          const wallet = kp.walletFrom(secret)
          return wallet.privateKey
        }))

        const secret = await keypairManager.getSecret(this.state.miner)
        miner = { address: this.state.miner, secret }
      }
    } else {
      keys = keypairs.map(k => k.address)
    }

    this.setState({ pending: `${t('keypair.creating')}...` })

    await instanceChannel.invoke('create', {
      name: this.state.name,
      version: this.state.version,
      networkId: this.props.networkId,
      miner,
      keys,
    })
    this.modal.current.closeModal()
    notification.success(t('network.dev.successful'))
    this.setState({
      pending: false,
      name: '',
      version: '',
      miner: ''
    })
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
          {t('network.dev.newInstance')}
        </Button>
        <Modal
          ref={this.modal}
          overflow
          title={`${t('network.dev.newInstance')} (${this.props.networkId})`}
          textConfirm={t('keypair.create')}
          onConfirm={this.onCreateInstance}
          pending={this.state.pending}
          confirmDisabled={!this.state.name || !this.state.version}
        >
          <DebouncedFormGroup
            label={t('network.dev.name')}
            placeholder={t('network.dev.placeholder')}
            maxLength='30'
            value={this.state.name}
            onChange={(name, invalid) => this.setState({ name, invalid })}
            validator={v => !/^[0-9a-zA-Z\-_]*$/.test(v) && 'Instance name can only contain letters, digits, dash or underscore'}
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
