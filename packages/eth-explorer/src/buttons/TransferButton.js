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
import queue from '@obsidians/eth-queue'
import { t } from '@obsidians/i18n'

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
      accountBalance: account?.balance,
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
    const { recipient: to, token, amount } = this.state
    const from = this.props.from

    if (!amount) {
      notification.error(t('explorer.transactions.transferFailed'), t('explorer.transactions.transferFailedText'))
      return
    }

    this.setState({ pushing: true })

    try {
      const override = Object.fromEntries(networkManager.sdk?.txOptions.list.map(option => [option.name, option.default]))
      const tx = await networkManager.sdk.getTransferTransaction({ from, to, token, amount }, override)
      await new Promise((resolve, reject) => {
        queue.add(
          () => networkManager.sdk.sendTransaction(tx),
          {
            title: token === 'core' ? `Transfer ${networkManager.symbol}` : `Transfer ${token.symbol}`,
            name: token === 'core' ? `Transfer` : `Transfer (${token.symbol})`,
            signer: from,
            address: from,
            value: token === 'core' ? networkManager.sdk.utils.unit.toValue(amount) : undefined,
            params: { from, to, amount },
          },
          {
            pushing: () => {
              this.setState({ pushing: false, amount: '' })
              this.modal.current.closeModal()
            },
            executed: resolve,
            'failed-timeout': reject,
            failed: reject,
          }
        ).catch(reject)
      })
    } catch (e) {
      console.warn('transfer failed', e)
      notification.error(t('explorer.transactions.transferFailed'), e.reason || e.message)
      this.setState({ pushing: false })
      return
    }
  }

  renderTokens () {
    const { accountBalance, tokens, token } = this.state
    if (!tokens) {
      return null
    }

    let formattedBalance
    if (accountBalance > 1e14) {
      formattedBalance = accountBalance.toExponential()
    } else {
      formattedBalance = new Intl.NumberFormat().format(accountBalance)
    }
    const accountBadge = `${formattedBalance} ${networkManager.symbol}`

    return (
      <DropdownInput
        label='Token'
        renderText={option => option.text}
        options={[
          {
            id: 'core',
            text: networkManager.symbol,
            display: (
              <div className='d-flex align-items-center justify-content-between'>
                {networkManager.symbol}<Badge color='info'>{accountBadge}</Badge>
              </div>
            ),
            badge: accountBadge,
          },
          ...tokens.filter(t => t.type === 'ERC20').map(t => {
            const badge = `${new Intl.NumberFormat().format(t.balance / 10 ** t.decimals)} ${t.symbol}`
            return {
              id: t,
              text: <div className='d-flex align-items-center'><img src={t.icon} className='token-icon mr-2' />{t.name}</div>,
              display: (
                <div className='d-flex align-items-center justify-content-between overflow-hidden'>
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
    const { addressLength = 42, from } = this.props
    const { loading, accountBalance, token, amount, recipient, pushing } = this.state
    const big = networkManager.sdk?.utils.format.big
    const max = token === 'core'
      ? `${accountBalance || 0} ${networkManager.symbol}`
      : `${big(token.balance).div(big(10).pow(token.decimals)).toString()} ${token.symbol}`
    
    const mataMaskAccount = networkManager?.browserExtension?.currentAccount || ''

    return <>
      <ToolbarButton
        id='navbar-transfer'
        size='md'
        icon='fas fa-repeat'
        readOnly={process.env.REACT_APP_PROJECT_SHARE_URL && !networkManager.sdk?.utils?.isValidAddress(from)}
        loading={loading}
        tooltip={t('transfer')}
        onClick={this.openModal}
      />
      <Modal
        ref={this.modal}
        overflow
        title={t('transfer')}
        textConfirm={t('signPush')}
        confirmDisabled={false}
        onConfirm={this.push}
        pending={pushing && t('pushing')}
      >
        {this.renderTokens()}
        <DebouncedFormGroup
          ref={this.amountInput}
          label={t('amount')}
          maxLength='50'
          placeholder={`Max: ${max}`}
          value={amount}
          onChange={amount => this.setState({ amount })}
        />
        <FormGroup>
          <Label>{t('recipient')}</Label>
          <KeypairInputSelector
            ref={this.keypairInput}
            editable
            icon='fas fa-map-marker-alt'
            placeholder='Recipient address'
            maxLength={addressLength}
            extra={networkManager.browserExtension?.isEnabled && mataMaskAccount && [{
              group: networkManager.browserExtension.name.toLowerCase(),
              badge: networkManager.browserExtension.name,
              children: [{address: mataMaskAccount, name: networkManager.browserExtension.name }]
            }]}
            value={recipient}
            onChange={recipient => this.setState({ recipient })}
          />
        </FormGroup>
      </Modal>
    </>
  }
}
