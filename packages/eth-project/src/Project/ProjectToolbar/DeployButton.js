import React, { PureComponent } from 'react'

import {
  Modal,
  DropdownInput,
  Button,
  UncontrolledTooltip,
  Label,
} from '@obsidians/ui-components'

import fileOps from '@obsidians/file-ops'
import notification from '@obsidians/notification'
import { KeypairInputSelector } from '@obsidians/keypair'
import { txOptions } from '@obsidians/sdk'

import { networkManager } from '@obsidians/eth-network'
import { ContractForm, ActionParamFormGroup } from '@obsidians/eth-contract'

export default class DeployerButton extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      selected: '',
      contractsFolder: '',
      contracts: [],
      contractName: '',
      contractObj: null,
      constructorAbi: null,
      signer: '',
      pending: false,
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

  getDeploymentParameters = async (option, callback, estimate) => {
    let contractPath, contracts
    if (typeof option === 'string') {
      contractPath = option
      this.getConstructorAbiArgs = contractObj => [contractObj.abi]
    } else {
      contractPath = option.contractPath
      contracts = option.contracts
      this.getConstructorAbiArgs = option.getConstructorAbiArgs
    }
    const { dir: contractsFolder, base: selected } = fileOps.current.path.parse(contractPath)
    const files = await fileOps.current.listFolder(contractsFolder)
    this.setState({
      selected,
      contractsFolder,
      contracts: contracts || files.map(f => f.name).filter(name => name.endsWith('.json')),
    })

    this.modal.current.openModal()
    await this.updateAbi(contractPath)
    const options = {}
    txOptions.list && txOptions.list.forEach(opt => options[opt.name] = '')
    this.setState(options)
    this.callback = callback
    this.estimateCallback = estimate
  }

  updateContract = async selected => {
    this.setState({ selected })
    const contractPath = fileOps.current.path.join(this.state.contractsFolder, selected)
    await this.updateAbi(contractPath)
  }

  updateAbi = async contractPath => {
    const contractName = fileOps.current.path.parse(contractPath).name

    let contractObj
    try {
      contractObj = await this.readContractJson(contractPath)
    } catch (e) {
      notification.error('ABI File Error', e.message)
      return
    }

    let constructorAbi
    try {
      constructorAbi = await this.getConstructorAbi(...this.getConstructorAbiArgs(contractObj))
    } catch (e) {
      notification.error('ABI File Error', e.message)
      return
    }

    this.setState({
      contractName: contractObj.contractName || contractName,
      contractObj,
      constructorAbi,
    })
  }
  
  readContractJson = async contractPath => {
    const contractJson = await fileOps.current.readFile(contractPath)

    try {
      return JSON.parse(contractJson)
    } catch (e) {
      throw new Error(`Error in reading <b>${contractPath}</b>. Not a valid JSON file.`)
    }
  }

  getConstructorAbi = (contractAbi, { key = 'type', value = 'constructor' } = {}) => {
    if (!contractAbi) {
      throw new Error(`Error in reading the ABI.`)
    }
    if (!Array.isArray(contractAbi)) {
      throw new Error(`Error in reading the ABI. Field abi is not an array.`)
    }
    return contractAbi.find(item => item[key] === value)
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

    const { contractName, contractObj, signer } = this.state
    const options = {}
    txOptions.list && txOptions.list.forEach(opt => options[opt.name] = this.state[opt.name] || opt.default)

    const result = await this.estimateCallback(contractObj, { parameters, contractName, signer, ...options })

    if (result) {
      this.setState(result)
    }
  }

  confirmDeploymentParameters = () => {
    let parameters = { array: [], obj: {} }
    if (this.state.constructorAbi) {
      try {
        parameters = this.form?.getParameters()
      } catch (e) {
        notification.error('Error in Constructor Parameters', e.message)
        return
      }
    }

    const { contractName, contractObj, signer } = this.state
    const options = {}
    txOptions.list && txOptions.list.forEach(opt => options[opt.name] = this.state[opt.name] || opt.default)

    this.callback(contractObj, { parameters, contractName, signer, ...options })
  }

  closeModal = () => {
    this.modal.current.closeModal()
  }

  render () {
    const signer = this.props.signer
    const { contracts, selected, contractName, pending } = this.state

    let icon = <span key='deploy-icon'><i className='fab fa-docker' /></span>
    if (pending) {
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
        { pending ? 'Deploying' : `Deploy`}
      </UncontrolledTooltip>
      <Modal
        ref={this.modal}
        overflow
        title={<span>Deploy Contract <b>{contractName}</b></span>}
        textConfirm='Deploy'
        pending={pending && 'Deploying...'}
        onConfirm={this.confirmDeploymentParameters}
        textActions={[`Estimate ${txOptions.title}`]}
        onActions={[this.estimate]}
      >
        <DropdownInput
          label='Contract ABI'
          options={contracts.map(c => ({ id: c, display: c }))}
          value={selected}
          onChange={this.updateContract}
        />
        {constructorParameters}
        <KeypairInputSelector
          label='Signer'
          extra={networkManager.browserExtension?.isEnabled && signer && [{
            group: networkManager.browserExtension.name.toLowerCase(),
            badge: networkManager.browserExtension.name,
            children: [{ address: signer, name: networkManager.browserExtension.name }],
          }]}
          value={this.state.signer}
          onChange={signer => this.setState({ signer })}
        />
        <div className='row'>
          {
            txOptions.list?.length &&
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