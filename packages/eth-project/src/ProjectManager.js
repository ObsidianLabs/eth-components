import notification from '@obsidians/notification'
import redux from '@obsidians/redux'

import { ProjectManager, BaseProjectManager } from '@obsidians/workspace'
import { modelSessionManager } from '@obsidians/code-editor'
import premiumEditor from '@obsidians/premium-editor'

import { networkManager } from '@obsidians/eth-network'
import compilerManager, { CompilerManager } from '@obsidians/compiler'
import { utils } from '@obsidians/sdk'
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

    onEditorReady (editor, editorComponent) {
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
        () => {
          editorComponent.props.onCommand('save')
          this.lint()
        }
      )

      setTimeout(() => this.lint(), 100)
    }

    async readProjectAbis () {
      const contractsFolder = this.pathForProjectFile('build/contracts')
      const files = await this.listFolder(contractsFolder)
      const contracts = await Promise.all(files
        .map(f => f.name)
        .filter(name => name.endsWith('.json'))
        .map(name => this.path.join(contractsFolder, name))
        .map(contractPath => this.readFile(contractPath, 'utf8')
          .then(content => ({
            contractPath,
            pathInProject: this.pathInProject(contractPath),
            content: JSON.parse(content)
          }))
          .catch(() => null)
        )
      )
      return contracts
        .filter(Boolean)
        .map(({ contractPath, pathInProject, content }) => {
          const name = content.contractName || this.path.parse(contractPath).name
          return { contractPath, pathInProject, name, abi: content?.abi, content }
        })
    }

    lint () {
      if (!premiumEditor.solidity) {
        return
      }
      if (!modelSessionManager.currentFilePath.endsWith('.sol')) {
        return
      }
      const code = modelSessionManager._editor.getValue()
      const solcVersion = this.projectSettings.get('compilers.solc')
      const result = premiumEditor.solidity.lint(code, { solcVersion })
      modelSessionManager.updateDecorations(result.map(item => ({
        ...item,
        filePath: modelSessionManager.currentFilePath,
      })))
    }

    async compile (sourceFile) {
      if (CompilerManager.button.state.building) {
        notification.error('Build Failed', 'Another build task is running now.')
        return false
      }

      const settings = await this.checkSettings()
  
      await this.project.saveAll()
      this.toggleTerminal(true)
  
      let result
      try {
        result = await compilerManager.build(settings, this, sourceFile)
      } catch {
        return false
      }
      if (result?.decorations) {
        modelSessionManager.updateDecorations(result.decorations)
      }
      if (result?.errors) {
        return false
      }
  
      return true
    }

    async getDefaultContractFileNode () {
      const settings = await this.checkSettings()
      if (!settings?.deploy) {
        throw new Error('Please set the smart contract to deploy in project settings.')
      }
      const filePath = this.pathForProjectFile(settings.deploy)
      const pathInProject = this.pathInProject(filePath)
      return { path: filePath, pathInProject }
    }
  
    async deploy (contractFileNode) {
      this.deployButton.getDeploymentParameters({
        contractFileNode: contractFileNode || await this.getDefaultContractFileNode(),
      },
        (contractObj, allParameters) => this.pushDeployment(contractObj, allParameters),
        (contractObj, allParameters) => this.estimate(contractObj, allParameters)
      )
    }

    checkSdkAndSigner (allParameters) {
      if (!networkManager.sdk) {
        notification.error('Deployment Error', 'No running node. Please start one first.')
        return true
      }
  
      if (!allParameters.signer) {
        notification.error('Deployment Error', 'No signer specified. Please select one to sign the deployment transaction.')
        return true
      }
    }

    validateDeployment (contractObj) {  
      let bytecode, deployedBytecode
      if (!this.remote) {
        bytecode = contractObj.bytecode
        deployedBytecode = contractObj.deployedBytecode
        if (typeof deployedBytecode !== 'string') {
          notification.error('Deployment Error', `Invalid <b>deployedBytecode</b> field in the built contract JSON. Please make sure you used ${process.env.COMPILER_NAME} to build the contract.`)
          return
        }
      } else {
        bytecode = contractObj.evm?.bytecode?.object
        deployedBytecode = contractObj.evm?.deployedBytecode?.object
        if (typeof deployedBytecode !== 'string') {
          notification.error('Deployment Error', `Invalid <b>evm.bytecode.object</b> field in the built contract JSON. Please make sure you selected a correct JSON file for a built smart contract.`)
          return
        }
        bytecode = '0x' + bytecode
        deployedBytecode = '0x' + deployedBytecode
      }
      return {
        abi: contractObj.abi,
        bytecode,
        deployedBytecode
      }
    }
    
    async estimate (contractObj, allParameters) {
      if (this.checkSdkAndSigner(allParameters)) {
        return
      }
      const deploy = this.validateDeployment(contractObj)
      if (!deploy) {
        return
      }
  
      const { parameters } = allParameters

      this.deployButton.setState({ pending: 'Estimating...' })

      let result
      try {
        const tx = await networkManager.sdk.getDeployTransaction({
          abi: deploy.abi,
          bytecode: deploy.bytecode,
          options: deploy.options,
          parameters: parameters.array
        }, {
          from: allParameters.signer,
        })
        result = await networkManager.sdk.estimate(tx)
      } catch (e) {
        notification.error('Estimate Error', e.message)
        this.deployButton.setState({ pending: false })
        return
      }

      this.deployButton.setState({ pending: false })

      return result
    }

    async pushDeployment (contractObj, allParameters) {
      if (this.checkSdkAndSigner(allParameters)) {
        return
      }
      const deploy = this.validateDeployment(contractObj)
      if (!deploy) {
        return
      }
  
      this.deployButton.setState({ pending: 'Deploying...', result: '' })
  
      const networkId = networkManager.sdk.networkId
      const { contractName, parameters, ...override } = allParameters
      const codeHash = utils.sign.sha3(deploy.deployedBytecode)
  
      let result
      try {
        const tx = await networkManager.sdk.getDeployTransaction({
          abi: deploy.abi,
          bytecode: deploy.bytecode,
          options: deploy.options,
          parameters: parameters.array
        }, {
          from: allParameters.signer,
          ...override
        })

        result = await new Promise((resolve, reject) => {
          queue.add(
            () => networkManager.sdk.sendTransaction(tx),
            {
              name: 'Deploy',
              contractName,
              signer: allParameters.signer,
              abi: deploy.abi,
              params: parameters.obj,
              ...override,
              modalWhenExecuted: true,
            },
            {
              pushing: () => this.deployButton.closeModal(),
              executed: ({ tx, receipt, abi }) => {
                resolve({
                  network: networkId,
                  codeHash,
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
        ...deploy.options,
        name: contractName,
        codeHash: result.codeHash,
        abi: JSON.stringify(deploy.abi),
      })
  
      const deployResultPath = this.path.join(this.projectRoot, 'deploys', `${result.network}_${moment().format('YYYYMMDD_HHmmss')}.json`)
      await this.ensureFile(deployResultPath)
      await this.writeFile(deployResultPath, JSON.stringify(result, null, 2))
    }
  }
}

export default {
  Local: makeProjectManager(ProjectManager.Local),
  Remote: makeProjectManager(ProjectManager.Remote),
}