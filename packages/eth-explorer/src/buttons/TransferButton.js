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
import { KeypairInputSelector } from '@obsidians/keypair'
import queue from '@obsidians/eth-queue'

export default class TransferButton extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      amount: '',
      recipient: '',
      pushing: false,
    }

    this.modal = React.createRef()
    this.amountInput = React.createRef()
  }

  openModal = async () => {
    if (!this.refresh()) {
      return
    }
    this.modal.current.openModal()
    setTimeout(() => this.amountInput.current.focus(), 100)
  }

  refresh = () => {
    const from = this.props.from
    if (!from || !networkManager.sdk.isValidAddress(from)) {
      return
    }
    return true
  }

  push = async () => {
    this.setState({ pushing: true })

    const { recipient: to, amount } = this.state
    const from = this.props.from

    try {
      const tx = await networkManager.sdk.getTransferTransaction({ from, to, amount })
      await queue.add(
        () => networkManager.sdk.sendTransaction(tx),
        {
          name: 'Transfer',
          signer: from,
          address: from,
          params: { from, to, amount },
        }
      )
    } catch (e) {
      notification.error('Push Transaction Failed', e.message)
      this.setState({ pushing: false })
      return
    }

    this.setState({ pushing: false })
    this.modal.current.closeModal()
  }

  render () {
    const { amount, recipient, pushing } = this.state

    return <>
      <ToolbarButton
        id='navbar-transfer'
        size='md'
        icon='fas fa-sign-out-alt'
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
            editable
            icon='fas fa-map-marker-alt'
            placeholder='Recipient address'
            maxLength={42}
            value={recipient}
            onChange={recipient => this.setState({ recipient })}
          />
        </FormGroup>
      </Modal>
    </>
  }
}
