import React, { PureComponent } from 'react'

import {
  Modal,
  Button,
  UncontrolledTooltip,
  Label,
} from '@obsidians/ui-components'

import notification from '@obsidians/notification'
import { KeypairInputSelector } from '@obsidians/keypair'
import { txOptions } from '@obsidians/sdk'

import { ContractForm, ActionParamFormGroup } from '@obsidians/eth-contract'

export default class DeployerButton extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      pending: false,
      constructorAbi: null,
      contractName: '',
      signer: '',
    }
    this.modal = React.createRef()
  }

  componentDidMount () {
    this.props.projectManager.deployButton = this
  }

  onClick = () => {
    if (this.state.pending) {
      return
    }
    this.props.projectManager.deploy()
  }

  getDeploymentParameters = (constructorAbi, contractName, callback, estimate) => {
    this.modal.current.openModal()
    const options = {}
    txOptions.list.forEach(opt => options[opt.name] = '')
    this.setState({
      constructorAbi,
      contractName,
      ...options,
    })
    this.callback = callback
    this.estimateCallback = estimate
  }

  estimate = async () => {
    let parameters = { array: [], obj: {} }
    if (this.state.constructorAbi) {
      try {
        parameters = this.form.getParameters()
      } catch (e) {
        return
      }
    }

    const { signer } = this.state
    const options = {}
    txOptions.list.forEach(opt => options[opt.name] = this.state[opt.name] || opt.default)

    const result = await this.estimateCallback({ parameters, signer, ...options })

    if (result) {
      this.setState(result)
    }
  }

  confirmDeploymentParameters = () => {
    let parameters = { array: [], obj: {} }
    if (this.state.constructorAbi) {
      try {
        parameters = this.form.getParameters()
      } catch (e) {
        notification.error('Error in Constructor Parameters', e.message)
        return
      }
    }

    const { signer } = this.state
    const options = {}
    txOptions.list.forEach(opt => options[opt.name] = this.state[opt.name] || opt.default)

    this.callback({ parameters, signer, ...options })
  }

  closeModal = () => {
    this.modal.current.closeModal()
  }

  render () {
    let icon = <span key='deploy-icon'><i className='fab fa-docker' /></span>
    if (this.state.pending) {
      icon = <span key='deploying-icon'><i className='fas fa-spinner fa-spin' /></span>
    }

    const { constructorAbi } = this.state
    let constructorParameters = null
    if (constructorAbi) {
      constructorParameters = <>
        <Label>Constructor Parameters</Label>
        <ContractForm
          ref={form => { this.form = form }}
          size='sm'
          {...constructorAbi}
          Empty={<div className='small'>(None)</div>}
        />
        <div className='mb-2' />
      </>
    }

    return <>
      <Button
        size='sm'
        color='default'
        id='toolbar-btn-deploy'
        key='toolbar-btn-deploy'
        className='rounded-0 border-0 flex-none px-2 w-5 flex-column align-items-center'
        onClick={this.onClick}
      >
        {icon}
      </Button>
      <UncontrolledTooltip trigger='hover' delay={0} placement='bottom' target='toolbar-btn-deploy'>
        { this.state.pending ? 'Deploying' : `Deploy`}
      </UncontrolledTooltip>
      <Modal
        ref={this.modal}
        overflow
        title={<span>Deploy Contract <b>{this.state.contractName}</b></span>}
        textConfirm='Deploy'
        onConfirm={this.confirmDeploymentParameters}
        textActions={[`Estimate ${txOptions.title}`]}
        onActions={[this.estimate]}
      >
        {constructorParameters}
        <KeypairInputSelector
          label='Signer'
          value={this.state.signer}
          onChange={signer => this.setState({ signer })}
        />
        <div className='row'>
          {
            txOptions.list.map(option => (
              <ActionParamFormGroup
                key={`deploy-param-${option.name}`}
                className={option.className}
                label={option.label}
                icon={option.icon}
                placeholder={option.placeholder}
                value={this.state[option.name]}
                onChange={value => this.setState({ [option.name]: value })}
              />
            ))
          }
        </div>
      </Modal>
    </>
  }
}