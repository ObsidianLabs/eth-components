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
    this.form = React.createRef()
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
    const { path: contractPath, pathInProject = contractPath } = option.contractFileNode
    if (option.getConstructorAbiArgs) {
      this.getConstructorAbiArgs = option.getConstructorAbiArgs
    } else {
      this.getConstructorAbiArgs = contractObj => [contractObj.abi]
    }
    const { dir: contractsFolder, base: selected } = fileOps.current.path.parse(contractPath)
    try {
      const files = await fileOps.current.listFolder(contractsFolder)
      this.setState({
        selected,
        contractsFolder,
        contracts: option.contracts || files.map(f => f.name).filter(name => name.endsWith('.json')),
      })
    } catch {
      notification.error('ABI File Not Found', `Cannot open the file <b>${pathInProject}</b>. Please make sure <i>smart contract to deploy</i> is pointting to a valid ABI file in the Project Settings.`)
      return
    }

    this.modal.current.openModal()
    await this.updateAbi(contractPath, pathInProject)
    const options = {}
    txOptions.list && txOptions.list.forEach(opt => options[opt.name] = '')
    this.setState(options)
    this.callback = callback
    this.estimateCallback = estimate
  }

  updateContract = async selected => {
    const txOptionObj = Object.fromEntries(txOptions.list.map(option => [option.name, '']))
    this.setState({ selected, ...txOptionObj })
    const contractPath = fileOps.current.path.join(this.state.contractsFolder, selected)
    await this.updateAbi(contractPath)
  }

  updateAbi = async (contractPath, pathInProject) => {
    const contractName = fileOps.current.path.parse(contractPath).name

    let contractObj
    try {
      contractObj = await this.readContractJson(contractPath, pathInProject)
    } catch (e) {
      notification.error('ABI File Not Found', `Cannot open the file <b>${pathInProject}</b>. Please make sure <i>smart contract to deploy</i> is pointting to a valid ABI file in the Project Settings.`)
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
  
  readContractJson = async (contractPath, pathInProject) => {
    const contractJson = await fileOps.current.readFile(contractPath)

    try {
      return JSON.parse(contractJson)
    } catch (e) {
      throw new Error(`Error in reading <b>${pathInProject}</b>. Not a valid JSON file.`)
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

  needEstimate = () => {
    if (this.props.skipEstimate) {
      return false
    }
    if (txOptions.list?.length) {
      const option = txOptions.list[0]
      const value = this.state[option.name]
      if (!value) {
        return true
      }
    }
    return false
  }

  renderTextActions = () => {
    if (this.state.pending) {
      return
    } else if (this.props.skipEstimate) {
      return [`Estimate ${txOptions.title}`]
    } else if (this.needEstimate()) {
      return
    } else {
      return ['Re-estimate']
    }
  }

  prepare = () => {
    let parameters = { array: [], obj: {} }
    if (this.state.constructorAbi) {
      try {
        parameters = this.form.current?.getParameters()
      } catch (e) {
        notification.error('Error in Constructor Parameters', e.message)
        return
      }
    }

    const { contractName, contractObj, signer } = this.state
    const options = {}
    txOptions.list && txOptions.list.forEach(opt => options[opt.name] = this.state[opt.name] || opt.default)

    return [contractObj, { parameters, contractName, signer, ...options }]
  }

  estimate = async () => {
    const args = this.prepare()
    if (!args) {
      return
    }
    const result = await this.estimateCallback(...args)
    if (result) {
      this.setState(result)
    }
  }

  confirmDeployment = async () => {
    if (this.needEstimate()) {
      this.estimate()
      return
    }

    const args = this.prepare()
    if (!args) {
      return
    }
    this.callback(...args)
  }

  closeModal = () => {
    this.modal.current.closeModal()
  }

  render () {
    const { signer } = this.props
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
          ref={this.form}
          key={selected}
          size='sm'
          {...constructorAbi}
          Empty={<div className='small'>(None)</div>}
        />
        <div className='mb-2' />
      </>
    }
    
    const needEstimate = this.needEstimate()

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
        { pending || `Deploy`}
      </UncontrolledTooltip>
      <Modal
        ref={this.modal}
        title={<span>Deploy Contract <b>{contractName}</b></span>}
        textConfirm={needEstimate ? 'Estimate & Deploy' : 'Deploy'}
        pending={pending}
        onConfirm={this.confirmDeployment}
        textActions={this.renderTextActions()}
        onActions={[this.estimate]}
      >
        <DropdownInput
          label='Contract ABI'
          options={contracts.map(c => ({ id: c, display: c }))}
          placeholder='No ABI Selected'
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
                value={this.state[option.name]}
                onChange={value => this.setState({ [option.name]: value })}
                placeholder={option.placeholder}
              />
            ))
          }
        </div>
      </Modal>
    </>
  }
}