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

import { KeypairInputSelector } from '@obsidians/keypair'
import notification from '@obsidians/notification'
import { networkManager } from '@obsidians/eth-network'

import DropdownCard from './components/DropdownCard'
import ContractForm from './components/ContractForm'

export default class ContractViews extends Component {
  state = {
    selected: 0,
    signer: '',
    executing: false,
    actionError: '',
    actionResult: '',
  }

  selectAction (index) {
    this.setState({
      selected: index,
      executing: false,
      actionError: '',
      actionResult: '',
    })
  }

  executeAction = async actionName => {
    if (this.state.executing) {
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

    let result
    try {
      result = await this.props.contract.query(actionName, parameters.array, {
        from: this.state.signer
      })
    } catch (e) {
      console.warn(e)
      this.setState({ executing: false, actionError: e.message, actionResult: '' })
      return
    }

    this.setState({
      executing: false,
      actionError: '',
      actionResult: JSON.stringify(result, null, 2),
    })
  }

  renderTableSelector = () => {
    const actions = this.props.abi
    const selectedAction = actions[this.state.selected] || {}

    return <>
      <UncontrolledButtonDropdown size='sm'>
        <DropdownToggle color='primary' caret className='rounded-0 border-0 px-2 border-right-1'>
          <i className='fas fa-function' />
          <code className='mx-1'><b>{selectedAction.name}</b></code>
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem header>read functions</DropdownItem>
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
        id='contract-execute-view'
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
          <span>{actionError}</span>
        </div>
      )
    }
    
    if (actionResult) {
      return (
        <pre className='text-body pre-wrap break-all small user-select'>
          {actionResult}
        </pre>
      )
    }

    return <div className='small'>(None)</div>
  }

  render () {
    const { abi: actions, signer, signerSelector } = this.props

    if (!actions?.length) {
      return (
        <Screen>
          <p>No views found</p>
        </Screen>
      )
    }
    
    const selectedAction = actions[this.state.selected] || {}

    return (
      <div className='d-flex flex-column align-items-stretch h-100'>
        <div className='d-flex border-bottom-1'>
          {this.renderTableSelector()}
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
          </DropdownCard>
          {
            signerSelector &&
            <DropdownCard
              isOpen
              title='Authorization'
              overflow
            >
              <KeypairInputSelector
                size='sm'
                label='Signer'
                extra={networkManager.browserExtension?.isEnabled && signer && [{
                  group: networkManager.browserExtension.name.toLowerCase(),
                  badge: networkManager.browserExtension.name,
                  children: [{ address: signer, name: networkManager.browserExtension.name }],
                }]}
                value={this.state.signer}
                onChange={signer => this.setState({ signer })}
              />
            </DropdownCard>
          }
          <DropdownCard
            isOpen
            title='Result'
            minHeight='120px'
            right={
              this.state.actionError
                ? <Badge color='danger'>Error</Badge>
                : this.state.actionResult ? <Badge color='success'>Success</Badge> : null
            }
          >
            {this.renderResult()}
          </DropdownCard>
        </div>
      </div>
    )
  }
}
