import React, { Component } from 'react'
import classnames from 'classnames'

import {
  Screen,
  UncontrolledButtonDropdown,
  ToolbarButton,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Badge,
} from '@obsidians/ui-components'
import { t } from '@obsidians/i18n'

import notification from '@obsidians/notification'
import { txOptions, utils } from '@obsidians/sdk'
import { KeypairInputSelector } from '@obsidians/keypair'
import queue from '@obsidians/eth-queue'
import { networkManager } from '@obsidians/eth-network'
import Highlight from 'react-highlight'

import DropdownCard from './components/DropdownCard'
import ContractForm, { ActionParamFormGroup } from './components/ContractForm'

export default class ContractActions extends Component {
  state = {
    selected: 0,
    amount: '',
    signer: '',
    executing: false,
    actionError: '',
    actionResult: '',
  }

  constructor (props) {
    super(props)
  }

  selectAction (index) {
    this.setState({
      selected: index,
      amount: '',
      executing: false,
      actionError: '',
      actionResult: '',
    })
  }

  estimate = async actionName => {
    let parameters = { array: [], obj: {} }
    try {
      parameters = this.form.getParameters()
    } catch (e) {
      notification.error(t('contract.error.parameters'), e.message)
      return
    }

    let result
    try {
      const value = utils.unit.toValue(this.state.amount || '0')
      const tx = await this.props.contract.execute(actionName, parameters.array, {
        from: this.state.signer,
        value,
      })
      result = await networkManager.sdk.estimate(tx)
    } catch (e) {
      notification.error(t('contract.error.estimate'), e.message)
      return
    }

    if (result) {
      this.setState(result)
    }
  }

  executeAction = async actionName => {
    if (this.state.executing) {
      return
    }

    if (!this.state.signer) {
      notification.error(t('contract.error.sign'), t('contract.error.noSigner'))
      return
    }

    let parameters = { array: [], obj: {} }
    try {
      parameters = this.form.getParameters()
    } catch (e) {
      notification.error(t('contract.error.parameters'), e.message)
      return
    }

    this.setState({ executing: true, actionError: '', actionResult: '' })

    const signer = this.state.signer

    const options = {}
    txOptions.list && txOptions.list.forEach(opt => options[opt.name] = this.state[opt.name] || opt.default)

    let result = {}
    try {
      const value = utils.unit.toValue(this.state.amount || '0')
      const tx = await this.props.contract.execute(actionName, parameters.array, {
        from: signer,
        value,
        ...options,
      })
      await queue.add(
        () => networkManager.sdk.sendTransaction(tx),
        {
          contractAddress: this.props.contract.address,
          name: actionName,
          functionName: actionName,
          signer,
          params: parameters.obj,
          value,
          ...options,
        }
      )
    } catch (e) {
      console.warn(e)
      notification.error(t('error'), e.message)
      this.setState({ executing: false, actionError: e.message, actionResult: '' })
      return
    }

    // notification.success('Success', 'Transaction is confirmed.')
    this.setState({
      executing: false,
      actionError: '',
      actionResult: JSON.stringify(result, null, 2)
    })
  }

  renderActionSelector = () => {
    const actions = this.props.abi
    const selectedAction = actions[this.state.selected] || {}

    return <>
      <UncontrolledButtonDropdown size='sm'>
        <DropdownToggle color='primary' caret className='rounded-0 border-0 px-2 border-right-1'>
          <i className='fas fa-function' />
          <code className='mx-1'><b>{selectedAction.name}</b></code>
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem header>{t('contract.writeFunctions')}</DropdownItem>
          {actions.map((item, index) => (
            <DropdownItem
              key={item.name}
              className={classnames({ active: index === this.state.selected })}
              onClick={() => this.selectAction(index)}
            >
              <code>{item.name}</code>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </UncontrolledButtonDropdown>
      <ToolbarButton
        id='contract-execute-action'
        icon={this.state.executing ? 'fas fa-spin fa-spinner' : 'fas fa-play'}
        tooltip={t('contract.execute')}
        className='border-right-1'
        onClick={() => this.executeAction(selectedAction.name)}
      />
    </>
  }

  renderResult = () => {
    const { actionError, actionResult } = this.state
    if (actionError) {
      return (
        <div>
          <span className='user-select'>{actionError}</span>
        </div>
      )
    }

    if (actionResult) {
      return (
        <Highlight
          language='javascript'
          className='pre-box bg2 pre-wrap break-all small user-select'
          element='pre'
        >
          <code>{actionResult}</code>
        </Highlight>
      )
    }

    return <div className='small'>({t('none')})</div>
  }

  render () {
    const { abi, signer } = this.props
    const selectedAction = abi[this.state.selected] || {}

    if (!abi.length) {
      return (
        <Screen>
          <p>{t('contract.error.noAction')}</p>
        </Screen>
      )
    }

    return (
      <div className='d-flex flex-column align-items-stretch h-100'>
        <div className='d-flex border-bottom-1'>
          {this.renderActionSelector()}
        </div>
        <div className='d-flex flex-column flex-grow-1 overflow-auto'>
          <DropdownCard
            isOpen
            title={t('contract.parameters')}
          >
            <ContractForm
              ref={form => { this.form = form }}
              size='sm'
              {...selectedAction}
              Empty={<div className='small'>({t('none')})</div>}
            />
            {
              (selectedAction.payable || selectedAction.stateMutability === 'payable') ?
              <ActionParamFormGroup
                size='sm'
                label={t('contract.toTransfer', { symbol: process.env.TOKEN_SYMBOL })}
                placeholder={`${t('contract.default')}: 0`}
                value={this.state.amount}
                onChange={amount => this.setState({ amount })}
                icon='fas fa-coins'
              /> : null
            }
          </DropdownCard>
          {
            txOptions.list?.length &&
            <DropdownCard
              isOpen
              title={txOptions.title}
              right={
                <Badge color='primary' onClick={evt => {
                  evt.stopPropagation()
                  this.estimate(selectedAction.name)
                }}>{t('contract.estimate')}</Badge>
              }
            >
              {
                txOptions.list.map(option => (
                  <ActionParamFormGroup
                    size='sm'
                    key={`param-${option.name}`}
                    label={option.label}
                    icon={option.icon}
                    placeholder={option.placeholder}
                    value={this.state[option.name]}
                    onChange={value => this.setState({ [option.name]: value })}
                  />
                ))
              }
            </DropdownCard>
          }
          <DropdownCard
            isOpen
            title={t('contract.authorization')}
            overflow
          >
            <KeypairInputSelector
              size='sm'
              label={t('contract.signer')}
              extra={networkManager.browserExtension?.isEnabled && signer && [{
                group: networkManager.browserExtension.name.toLowerCase(),
                badge: networkManager.browserExtension.name,
                children: [{ address: signer, name: networkManager.browserExtension.name }],
              }]}
              value={this.state.signer}
              onChange={signer => this.setState({ signer })}
            />
          </DropdownCard>
        </div>
      </div>
    )
  }
}
