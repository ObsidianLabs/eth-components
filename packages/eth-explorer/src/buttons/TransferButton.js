import React, { PureComponent } from 'react'

import {
  Modal,
  ToolbarButton,
  DebouncedFormGroup,
  FormGroup,
  Label,
} from '@obsidians/ui-components'

import { networkManager } from '@obsidians/eth-network'
import notification from '@obsidians/notification'
import keypairManager, { KeypairInputSelector } from '@obsidians/keypair'
import queue from '@obsidians/eth-queue'

export default class TransferButton extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      amount: '',
      recipient: '',
      pushing: false,
    }

    this.modal = React.createRef()
    this.keypairInput = React.createRef()
    this.amountInput = React.createRef()
  }

  openModal = async () => {
    if (!await this.refresh()) {
      return
    }
    this.modal.current.openModal()
    setTimeout(() => this.amountInput.current.focus(), 100)
  }

  refresh = async () => {
    const { from, signer } = this.props
    if (!from || !await networkManager.sdk.isValidAddress(from)) {
      return
    }
    if (signer && signer !== from) {
      this.setState({ loading: true })
      try {
        await keypairManager.getKeypair(from)
      } catch {
        notification.error('Cannot Transfer', `Please add the address <b>${from}</b> in the keypair manager or select it in ${process.env.BROWSER_EXTENSION_NAME}.`)
        this.setState({ loading: false })
        return
      }
      this.setState({ loading: false })
    }
    return true
  }

  push = async () => {
    this.setState({ pushing: true })

    const { recipient: to, amount } = this.state
    const from = this.props.from

    try {
      const tx = await networkManager.sdk.getTransferTransaction({ from, to, amount })
      await new Promise((resolve, reject) => {
        queue.add(
          () => networkManager.sdk.sendTransaction(tx),
          {
            name: 'Transfer',
            signer: from,
            address: from,
            params: { from, to, amount },
          },
          {
            pushing: () => {
              this.setState({ pushing: false })
              this.modal.current.closeModal()
            },
            executed: resolve,
            'failed-timeout': reject,
            failed: reject,
          }
        )
      })
    } catch (e) {
      console.warn(e)
      notification.error('Push Transaction Failed', e.message)
      this.setState({ pushing: false })
      return
    }
  }

  render () {
    const { addressLength = 42 } = this.props
    const { loading, amount, recipient, pushing } = this.state

    return <>
      <ToolbarButton
        id='navbar-transfer'
        size='md'
        icon='fas fa-sign-out-alt'
        loading={loading}
        tooltip='Transfer'
        onClick={this.openModal}
      />
      <Modal
        ref={this.modal}
        overflow
        title='Transfer'
        textConfirm='Sign and Push'
        confirmDisabled={false}
        onConfirm={this.push}
        pending={pushing && 'Pushing...'}
      >
        <DebouncedFormGroup
          ref={this.amountInput}
          label='Amount'
          maxLength='50'
          value={amount}
          onChange={amount => this.setState({ amount })}
        />
        <FormGroup>
          <Label>Recipient</Label>
          <KeypairInputSelector
            ref={this.keypairInput}
            editable
            icon='fas fa-map-marker-alt'
            placeholder='Recipient address'
            maxLength={addressLength}
            extra={networkManager.browserExtension?.isEnabled && [{
              group: networkManager.browserExtension.name.toLowerCase(),
              badge: networkManager.browserExtension.name,
              children: networkManager.browserExtension?.allAccounts?.map(address => ({ address })) || []
            }]}
            value={recipient}
            onChange={recipient => this.setState({ recipient })}
          />
        </FormGroup>
      </Modal>
    </>
  }
}
