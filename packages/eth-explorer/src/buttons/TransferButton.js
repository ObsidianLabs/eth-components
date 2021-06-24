import React, { PureComponent } from 'react'

import {
  Modal,
  ToolbarButton,
  DebouncedFormGroup,
  FormGroup,
  Label,
  DropdownInput,
  Badge,
} from '@obsidians/ui-components'

import { networkManager } from '@obsidians/eth-network'
import notification from '@obsidians/notification'
import keypairManager, { KeypairInputSelector } from '@obsidians/keypair'
import { txOptions, utils } from '@obsidians/sdk'
import queue from '@obsidians/eth-queue'

export default class TransferButton extends PureComponent {
  constructor(props) {
    super(props)

    this.state = {
      loading: false,
      accountBalance: '',
      tokens: [],
      token: 'core',
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
    const { account, tokens } = this.props.explorer.currentPage?.state
    this.setState({
      accountBalance: account.balance,
      token: 'core',
      tokens: tokens?.length ? tokens : null
    })
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
        notification.error('Cannot Transfer', `Please add the address <b>${from}</b> in the keypair manager or select it in ${networkManager.browserExtension.name}.`)
        this.setState({ loading: false })
        return
      }
      this.setState({ loading: false })
    }
    return true
  }

  push = async () => {
    this.setState({ pushing: true })

    const { recipient: to, token, amount } = this.state
    const from = this.props.from

    const override = Object.fromEntries(txOptions.list.map(option => [option.name, option.default]))
    try {
      const tx = await networkManager.sdk.getTransferTransaction({ from, to, token, amount }, override)
      await new Promise((resolve, reject) => {
        queue.add(
          () => networkManager.sdk.sendTransaction(tx),
          {
            name: token === 'core' ? 'Transfer' : `${token.symbol} Transfer`,
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
        ).catch(reject)
      })
    } catch (e) {
      console.warn(e)
      notification.error('Push Transaction Failed', e.message)
      this.setState({ pushing: false })
      return
    }
  }

  renderTokens () {
    const { accountBalance, tokens, token } = this.state
    if (!tokens) {
      return null
    }

    const accountBadge = `${new Intl.NumberFormat().format(accountBalance)} ${process.env.TOKEN_SYMBOL}`

    return (
      <DropdownInput
        label='Token'
        renderText={option => option.text}
        options={[
          {
            id: 'core',
            text: process.env.TOKEN_SYMBOL,
            display: (
              <div className='d-flex align-items-center justify-content-between'>
                {process.env.TOKEN_SYMBOL}<Badge color='info'>{accountBadge}</Badge>
              </div>
            ),
            badge: accountBadge,
          },
          ...tokens.map(t => {
            const badge = `${new Intl.NumberFormat().format(t.balance / 10 ** t.decimals)} ${t.symbol}`
            return {
              id: t,
              text: <div className='d-flex align-items-center'><img src={t.icon} className='token-icon mr-2' />{t.name}</div>,
              display: (
                <div className='d-flex align-items-center justify-content-between'>
                  <div className='d-flex align-items-center'>
                    <img src={t.icon} className='token-icon mr-2' />
                    {t.name}
                  </div>
                  <Badge color='info'>{badge}</Badge>
                </div>
              ),
              badge,
            }
          })
        ]}
        value={token}
        onChange={token => this.setState({ token })}
      />
    )
  }

  render () {
    const { addressLength = 42 } = this.props
    const { loading, accountBalance, token, amount, recipient, pushing } = this.state
    const max = token === 'core'
      ? `${accountBalance} ${process.env.TOKEN_SYMBOL}`
      : `${utils.format.big(token.balance).div(10 ** token.decimals).toString()} ${token.symbol}`
    
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
        {this.renderTokens()}
        <DebouncedFormGroup
          ref={this.amountInput}
          label='Amount'
          maxLength='50'
          placeholder={`Max: ${max}`}
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
