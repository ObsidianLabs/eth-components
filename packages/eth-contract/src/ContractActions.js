import React, { Component } from 'react'
import classnames from 'classnames'

import {
  UncontrolledButtonDropdown,
  ToolbarButton,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  FormGroup,
  Label,
  Badge,
} from '@obsidians/ui-components'

import notification from '@obsidians/notification'
import { utils } from '@obsidians/sdk'
import { KeypairInputSelector } from '@obsidians/keypair'
import queue from '@obsidians/eth-queue'
import { networkManager } from '@obsidians/eth-network'
import Highlight from 'react-highlight'

import DropdownCard from './DropdownCard'
import ContractForm, { ActionParamInput } from './ContractForm'

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
      notification.error('Error in Parameters', e.message)
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
      notification.error('Estimate Error', e.message)
      return
    }

    if (result) {
      const gas = result.gasUsed?.toString() || ''
      const storage = result.storageCollateralized?.toString() || ''
      this.setState({ gas, storage })
    }
  }

  executeAction = async actionName => {
    if (this.state.executing) {
      return
    }

    if (!this.state.signer) {
      notification.error('Error', 'No signer is provided.')
      return
    }
    
    let parameters = { array: [], obj: {} }
    try {
      parameters = this.form.getParameters()
    } catch (e) {
      notification.error('Error in Parameters', e.message)
      return
    }

    this.setState({ executing: true, actionError: '', actionResult: '' })

    const signer = this.state.signer
    const gas = this.state.gas || 1000000
    const gasPrice = this.state.gasPrice || 100
    const storageLimit = this.state.storage || undefined

    let result = {}
    try {
      const value = utils.unit.toValue(this.state.amount || '0')
      const tx = await this.props.contract.execute(actionName, parameters.array, {
        from: signer,
        value,
        // gas,
        // gasPrice,
        // storageLimit
      })
      await queue.add(
        () => networkManager.sdk.sendTransaction(tx),
        {
          contractAddress: this.props.contract.address,
          name: actionName,
          functionName: actionName,
          signer,
          params: parameters.obj,
          value, gas, gasPrice, storageLimit,
        }
      )
    } catch (e) {
      notification.error('Error', e.message)
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
          <DropdownItem header>write functions</DropdownItem>
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
        id='contract-execute'
        icon={this.state.executing ? 'fas fa-spin fa-spinner' : 'fas fa-play'}
        tooltip='Execute'
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

    return <div className='small'>(None)</div>
  }

  render () {
    const actions = this.props.abi
    const selectedAction = actions[this.state.selected] || {}

    return (
      <div className='d-flex flex-column align-items-stretch h-100'>
        <div className='d-flex border-bottom-1'>
          {this.renderActionSelector()}
        </div>
        <div className='d-flex flex-column flex-grow-1 overflow-auto'>
          <DropdownCard
            isOpen
            title='Parameters'
          >
            <ContractForm
              ref={form => { this.form = form }}
              size='sm'
              {...selectedAction}
              Empty={<div className='small'>(None)</div>}
            />
            {
              (selectedAction.payable || selectedAction.stateMutability === 'payable') ?
              <FormGroup className='mb-2'>
                <Label className='mb-1 small font-weight-bold'>{process.env.TOKEN_SYMBOL} to Transfer</Label>
                <ActionParamInput
                  size='sm'
                  type='name'
                  placeholder={`Default: 0`}
                  value={this.state.amount}
                  onChange={amount => this.setState({ amount })}
                >
                  <span><i className='fas fa-coins' /></span>
                </ActionParamInput>
              </FormGroup> : null
            }
          </DropdownCard>
          <DropdownCard
            isOpen
            title={`Gas & Storage`}
            right={
              <Badge color='primary' onClick={evt => {
                evt.stopPropagation()
                this.estimate(selectedAction.name)
              }}>Estimate</Badge>
            }
          >
            <FormGroup className='mb-2'>
              <Label className='mb-1 small font-weight-bold'>Gas Limit</Label>
              <ActionParamInput
                size='sm'
                placeholder={`Default: 1,000,000`}
                value={this.state.gas}
                onChange={gas => this.setState({ gas })}
              >
                <span><i className='fas fa-burn' /></span>
              </ActionParamInput>
            </FormGroup>
            <FormGroup className='mb-2'>
              <Label className='mb-1 small font-weight-bold'>Gas Price</Label>
              <ActionParamInput
                size='sm'
                placeholder={`Default: 100 drip`}
                value={this.state.gasPrice}
                onChange={gasPrice => this.setState({ gasPrice })}
              >
                <span><i className='fas fa-dollar-sign' /></span>
              </ActionParamInput>
            </FormGroup>
            <FormGroup className='mb-2'>
              <Label className='mb-1 small font-weight-bold'>Storage Limit</Label>
              <ActionParamInput
                size='sm'
                value={this.state.storage}
                onChange={storage => this.setState({ storage })}
              >
                <span><i className='fas fa-hdd' /></span>
              </ActionParamInput>
            </FormGroup>
          </DropdownCard>
          <DropdownCard
            isOpen
            title='Authorization'
            overflow
          >
            <KeypairInputSelector
              size='sm'
              label='Signer'
              value={this.state.signer}
              onChange={signer => this.setState({ signer })}
            />
          </DropdownCard>
        </div>
      </div>
    )
  }
}
