import fileOps from '@obsidians/file-ops'
import notification from '@obsidians/notification'
import redux from '@obsidians/redux'

import { ProjectManager, BaseProjectManager } from '@obsidians/workspace'

import { networkManager } from '@obsidians/eth-network'
import compilerManager from '@obsidians/eth-compiler'
import { signatureProvider, Account, utils } from '@obsidians/sdk'
import queue from '@obsidians/eth-queue'

import moment from 'moment'

import ProjectSettings from './ProjectSettings'

BaseProjectManager.ProjectSettings = ProjectSettings

function makeProjectManager (Base) {
  return class ExtendedProjectManager extends Base {
    constructor (project, projectRoot) {
      super(project, projectRoot)
      this.deployButton = null
    }
  
    get settingsFilePath () {
      return this.pathForProjectFile('config.json')
    }
  
    async compile () {
      const settings = await this.checkSettings()
  
      await this.project.saveAll()
      this.toggleTerminal(true)
  
      try {
        await compilerManager.build(settings.compilers)
      } catch (e) {
        console.warn(e)
        return false
      }
  
      return true
    }
  
    async deploy (contractPath) {
      if (!contractPath) {
        const settings = await this.checkSettings()
        if (!settings?.deploy) {
          throw new Error('Please set the smart contract to deploy in project settings.')
        }
        contractPath = this.pathForProjectFile(settings.deploy)
      }
  
      let contractObj
      try {
        contractObj = await this.readContractJson(contractPath)
      } catch (e) {
        notification.error('Deploy Error', e.message)
        return
      }
  
      let constructorAbi
      try {
        constructorAbi = await this.getConstructorAbi(contractObj)
      } catch (e) {
        notification.error('Deploy Error', e.message)
        return
      }
  
      this.deployButton.getDeploymentParameters(constructorAbi, contractObj.contractName, 
        allParameters => this.pushDeployment(contractObj, allParameters),
        allParameters => this.estimate(contractObj, allParameters)
      )
    }
  
    async readContractJson (contractPath) {
      const contractJson = await fileOps.current.readFile(contractPath)
  
      try {
        return JSON.parse(contractJson)
      } catch (e) {
        throw new Error(`Error in reading <b>${contractPath}</b>. Not a valid JSON file.`)
      }
    }
  
    getConstructorAbi (contractObj) {
      if (!contractObj.abi) {
        throw new Error(`Error in reading the ABI. Does not have the field abi.`)
      }
      if (!Array.isArray(contractObj.abi)) {
        throw new Error(`Error in reading the ABI. Field abi is not an array.`)
      }
      const constructorAbi = contractObj.abi.find(item => item.type === 'constructor')
      return constructorAbi
    }
    
    async estimate (contractObj, allParameters) {
      if (!networkManager.sdk) {
        notification.error('Estimate Error', 'No running node. Please start one first.')
        return
      }
  
      if (!allParameters.signer) {
        notification.error('Estimate Error', 'No signer specified. Please select one to sign the deployment transaction.')
        return
      }
  
      const deployedBytecode = contractObj.deployedBytecode
      if (typeof deployedBytecode !== 'string') {
        notification.error('Estimate Error', `Invalid <b>deployedBytecode</b> field in the built contract JSON. Please make sure you used ${process.env.COMPILER_NAME} to build the contract.`)
        return
      }
  
      const signer = new Account(allParameters.signer, signatureProvider)
      const contractInstance = networkManager.sdk.contractFrom(contractObj)
      const { parameters } = allParameters

      let result
      try {
        result = await contractInstance.constructor
          .call(...parameters.array)
          .estimateGasAndCollateral({ from: signer })
      } catch (e) {
        notification.error('Estimate Error', e.message)
        return
      }

      return result
    }

    async pushDeployment (contractObj, allParameters) {
      if (!networkManager.sdk) {
        notification.error('Deploy Error', 'No running node. Please start one first.')
        return
      }
  
      if (!allParameters.signer) {
        notification.error('Deploy Error', 'No signer specified. Please select one to sign the deployment transaction.')
        return
      }
  
      const deployedBytecode = contractObj.deployedBytecode
      if (typeof deployedBytecode !== 'string') {
        notification.error('Deploy Error', `Invalid <b>deployedBytecode</b> field in the built contract JSON. Please make sure you used ${process.env.COMPILER_NAME} to build the contract.`)
        return
      }
  
      const contractName = contractObj.contractName
      this.deployButton.setState({ pending: true, result: '' })
  
      const networkId = networkManager.sdk.networkId
      const signer = new Account(allParameters.signer, signatureProvider)
      const contractInstance = networkManager.sdk.contractFrom(contractObj)
      const { parameters, gas, gasPrice, storageLimit } = allParameters
      const codeHash = utils.sign.sha3(Buffer.from(deployedBytecode.replace('0x', ''), 'hex')).toString('hex')
  
      let result
      try {
        result = await new Promise((resolve, reject) => {
          queue.add(
            () => contractInstance.constructor
              .call(...parameters.array)
              .sendTransaction({ from: signer, gas, gasPrice, storageLimit }),
            {
              name: 'Deploy',
              contractName,
              signer: signer.address,
              abi: contractObj.abi,
              params: parameters.obj,
              gas, gasPrice, storageLimit,
              modalWhenExecuted: true,
            },
            {
              pushing: () => this.deployButton.closeModal(),
              executed: ({ tx, receipt, abi }) => {
                resolve({
                  network: networkId,
                  contractCreated: receipt.contractCreated,
                  codeHash: `0x${codeHash}`,
                  ...parameters,
                  tx,
                  receipt,
                  abi,
                })
                return true
              },
              'failed-timeout': reject,
              failed: reject,
            }
          ).catch(reject)
        })
      } catch (e) {
        console.warn(e)
        if (e.data) {
          notification.error('Deploy Failed', `${e.message}<br />${e.data}`)
        } else {
          notification.error('Deploy Failed', e.message)
        }
        this.deployButton.setState({ pending: false })
        return
      }
  
      this.deployButton.setState({ pending: false })
      notification.success('Deploy Successful')
  
      redux.dispatch('ABI_ADD', {
        name: contractName,
        codeHash: result.codeHash,
        abi: JSON.stringify(contractObj.abi),
      })
  
      const deployResultPath = fileOps.current.path.join(this.projectRoot, 'deploys', `${result.network}_${moment().format('YYYYMMDD_HHmmss')}.json`)
      await fileOps.current.ensureFile(deployResultPath)
      await fileOps.current.writeFile(deployResultPath, JSON.stringify(result, null, 2))
    }
  }
}

export default {
  Local: makeProjectManager(ProjectManager.Local),
  Remote: makeProjectManager(ProjectManager.Remote),
}