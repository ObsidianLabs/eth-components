import React, { PureComponent } from 'react'
import classnames from 'classnames'

import {
  Screen,
  ButtonGroup,
  UncontrolledButtonDropdown,
  ToolbarButton,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Badge,
} from '@obsidians/ui-components'

import { KeypairInputSelector } from '@obsidians/keypair'
import { networkManager } from '@obsidians/eth-network'

import FormSection from './FormSection'
import MarginlessFormSection from './MarginlessFormSection'

import ContractForm from './ContractForm'
import ActionParamFormGroup from './ContractForm/ActionParamFormGroup'

export default class AbiActionForm extends PureComponent {
  static FormSection = FormSection
  static MarginlessFormSection = MarginlessFormSection

  static defaultProps = {
    FormSection: MarginlessFormSection,
  }

  constructor (props) {
    super(props)
    
    const selected = Math.max(props.actions.findIndex(item => !item.header && !item.divider), 0)
    this.state = {
      selected,
      amount: '',
      signer: '',
      executing: false,
      actionError: '',
      actionResult: '',
    }
    this.form = React.createRef()
  }

  get selectedAction () {
    return this.props.actions[this.state.selected] || {}
  }

  selectAction = index => {
    this.setState({
      selected: index,
      amount: '',
      executing: false,
      actionError: '',
      actionResult: '',
    })
  }

  estimate = async actionName => {
  }

  executeAction = async actionName => {
  }

  renderActionSelector = () => {
    const selectedAction = this.selectedAction
    const {
      inModal,
      smDropdown,
      selectorHeader = 'actions',
      selectorIcon = 'fas fa-function',
      actions,
    } = this.props
    return (
      <ButtonGroup>
        <UncontrolledButtonDropdown size='sm'>
          <DropdownToggle
            color='primary'
            caret
            className={classnames(!inModal && 'rounded-0 border-0')}
          >
            <i className={selectorIcon} />
            <code className='ml-2 mr-1'><b>{selectedAction.name}</b></code>
          </DropdownToggle>
          <DropdownMenu className={classnames(smDropdown && 'dropdown-menu-sm')}>
            { selectorHeader && <DropdownItem header>{selectorHeader}</DropdownItem> }
            {actions.map((item, index) => {
              if (item.header) {
                return <DropdownItem key={item.header} header>{item.header}</DropdownItem>
              } else if (item.divider) {
                return <DropdownItem key={`divider-${index}`} divider />
              }
              return (
                <DropdownItem
                  key={item.name}
                  className={classnames({ active: index === this.state.selected })}
                  onClick={() => this.selectAction(index)}
                >
                  <code>{item.name}</code>
                </DropdownItem>
              )
            })}
          </DropdownMenu>
        </UncontrolledButtonDropdown>
        <ToolbarButton
          id={this.props.toolbarId}
          rounded={inModal}
          className={!inModal && 'border-right-1'}
          color={inModal ? 'primary' : 'default'}
          key={this.state.executing ? 'action-executing' : 'action-execute'}
          icon={this.state.executing ? 'fas fa-spin fa-spinner' : 'fas fa-play'}
          tooltip='Execute'
          onClick={() => this.executeAction(selectedAction.name)}
        />
      </ButtonGroup>
    )
  }

  renderGasOptions = selectedAction => {
    const { FormSection, txOptions } = this.props
    if (!txOptions) {
      return null
    }

    if (!txOptions.list?.length) {
      return null
    }
    const estimate = (
      <Badge color='primary' onClick={evt => {
        evt.stopPropagation()
        this.estimate(selectedAction.name)
      }}>Estimate</Badge>
    )
    return (
      <FormSection title={txOptions.title} right={estimate}>
        {txOptions.list.map(option => (
          <ActionParamFormGroup
            size='sm'
            key={`param-${option.name}`}
            label={option.label}
            icon={option.icon}
            value={this.state[option.name]}
            onChange={value => this.setState({ [option.name]: value })}
            placeholder={option.placeholder}
          />
        ))}
      </FormSection>
    )
  }

  renderAuthorization = () => {
    if (!this.props.signerSelector) {
      return null
    }

    const { FormSection, signer } = this.props
    return (
      <FormSection title='Authorization'>
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
      </FormSection>
    )
  }

  renderResult = () => {
    const { FormSection, showResult } = this.props
    if (!showResult) {
      return null
    }

    const badge = this.state.actionError
      ? <Badge color='danger'>Error</Badge>
      : this.state.actionResult
        ? <Badge color='success'>Success</Badge>
        : null
    return (
      <FormSection title='Result' right={badge}>
        {this.renderResultContent()}
      </FormSection>
    )
  }

  renderResultContent = () => {
    const { actionError, actionResult } = this.state
    if (actionError) {
      return <div><span>{actionError}</span></div>
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
    const { network, FormSection, inModal, actions } = this.props

    if (!actions.length) {
      return <Screen><p>No actions found</p></Screen>
    }

    const selectedAction = this.selectedAction
    return (
      <div className='d-flex flex-column align-items-stretch h-100'>
        <div className={classnames('d-flex', inModal ? 'mb-3' : 'border-bottom-1')}>
          {this.renderActionSelector()}
        </div>
        <div className={classnames(!inModal && 'd-flex flex-column flex-grow-1 overflow-auto')}>
          <FormSection title='Parameters'>
            <ContractForm
              ref={this.form}
              key={selectedAction.name}
              size='sm'
              {...selectedAction}
              Empty={<div className='small'>(None)</div>}
            />
            {
              (selectedAction.payable || selectedAction.stateMutability === 'payable') ?
              <ActionParamFormGroup
                size='sm'
                label={`${process.env.TOKEN_SYMBOL(network)} to Transfer`}
                icon='fas fa-coins'
                value={this.state.amount}
                onChange={amount => this.setState({ amount })}
                placeholder='Default: 0'
              /> : null
            }
          </FormSection>
          {this.renderGasOptions(selectedAction)}
          {this.renderAuthorization()}
          {this.renderResult()}
        </div>
      </div>
    )
  }
}
