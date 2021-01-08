import React, { Component } from 'react'
import classnames from 'classnames'

import {
  UncontrolledButtonDropdown,
  ToolbarButton,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Badge,
} from '@obsidians/ui-components'

import notification from '@obsidians/notification'
import DropdownCard from './DropdownCard'
import ContractForm from './ContractForm'

export default class ContractTable extends Component {
  state = {
    selected: 0,
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
      result = await this.props.contract[actionName].call(...parameters.array)
    } catch (e) {
      console.warn(e)
      // if (!this.state.executing) {
      //   return
      // }
      this.setState({ executing: false, actionError: e.message, actionResult: '' })
      return
    }

    // if (!this.state.executing) {
    //   return
    // }
    this.setState({
      executing: false,
      actionError: '',
      actionResult: JSON.stringify(result, null, 2)
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
    const actions = this.props.abi

    if (!actions || !actions.length) {
      return null
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
