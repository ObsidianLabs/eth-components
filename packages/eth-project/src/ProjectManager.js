import notification from '@obsidians/notification'
import redux from '@obsidians/redux'
import { t } from '@obsidians/i18n'
import { ProjectManager, BaseProjectManager } from '@obsidians/workspace'
import { modelSessionManager } from '@obsidians/code-editor'
import premiumEditor from '@obsidians/premium-editor'
import { networkManager } from '@obsidians/eth-network'
import compilerManager, { CompilerManager } from '@obsidians/compiler'
import queue from '@obsidians/eth-queue'
import debounce from 'lodash/debounce'
import moment from 'moment'
import ProjectSettings from './ProjectSettings'

BaseProjectManager.ProjectSettings = ProjectSettings

function makeProjectManager(Base) {
  return class ExtendedProjectManager extends Base {
    constructor(project, projectRoot) {
      super(project, projectRoot)
      this.deployButton = null
      this.onFileChanged = debounce(this.onFileChanged, 1500).bind(this)
    }

    get settingsFilePath() {
      return this.pathForProjectFile('config.json')
    }

    onEditorReady(editor, editorComponent) {
      modelSessionManager.decorationMap = {}
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KEY_S,
        () => {
          editorComponent.props.onCommand('save')
          this.lint()
        }
      )
      editor.onDidChangeModel(() => setTimeout(() => this.lint(), 100))
      setTimeout(() => this.lint(), 100)
      // reset the editor model sessions
    }

    onFileChanged() {
      this.lint()
    }

    async readPackageJson() {
      const packageJson = await this.readFile(this.pathForProjectFile('package.json'))
      return JSON.parse(packageJson)
    }

    async executeInTerminal(cmd) {
      this.toggleTerminal(true)
      return await compilerManager.execute(cmd)
    }

    lint() {
      if (!premiumEditor.solidity || !modelSessionManager.currentFilePath.endsWith('.sol')) {
        return
      }
      const currentCode = modelSessionManager._editor.getValue()
      const linter = this.projectSettings.get('linter') || 'solhint'
      const solcVersion = this.projectSettings.get('compilers.solc')
      const lintResult = premiumEditor.solidity.lint(currentCode, { linter, solcVersion })
      const { currentFilePath } = modelSessionManager
      const newValue = lintResult.length !== 0 ?
        lintResult.reduce((prev, cur) => {
          prev.push({
            ...cur,
            text: cur.text,
            from: 'linter',
            filePath: currentFilePath
          })
          return prev
        }, []) : []
      modelSessionManager.updateDecorations(newValue, currentFilePath)
    }

    async compile(sourceFile, finalCall) {
      if (CompilerManager.button.state.building) {
        notification.error(t('contract.build.fail'), t('contract.build.failText'))
        return false
      }

      const settings = await this.checkSettings()

      await this.project.saveAll()
      this.toggleTerminal(true)

      let result
      try {
        result = await compilerManager.build(settings, this, sourceFile)
      } catch {
        finalCall && finalCall()
        return false
      }
      if (result?.decorations) {
        modelSessionManager.updateDecorations(result.decorations)
      }
      if (result?.errors) {
        finalCall && finalCall()
        return false
      }
       
      finalCall && finalCall()
      return true
    }

    async deploy(contractFileNode) {
      if (!networkManager.sdk) {
        notification.error(t('contract.deploy.fail'), t('contract.deploy.failText'))
        return true
      }

      let contracts
      if (contractFileNode) {
        contractFileNode.pathInProject = this.pathInProject(contractFileNode.path)
        contracts = [contractFileNode]
      } else {
        try {
          contracts = await this.getBuiltContracts()
        } catch {
          notification.error(t('contract.deploy.connot'), t('contract.deploy.cannotTextFolder'))
          return
        }
      }

      if (!contracts.length) {
        notification.error(t('contract.deploy.connot'), t('contract.deploy.connotTextProject'))
        return
      }

      this.deployButton.getDeploymentParameters({
        contractFileNode: contractFileNode || await this.getDefaultContractFileNode(),
        contracts,
      },
        (contractObj, allParameters) => this.pushDeployment(contractObj, allParameters),
        (contractObj, allParameters) => this.estimate(contractObj, allParameters)
      )
    }

    async getDefaultContractFileNode() {
      const settings = await this.checkSettings()
      if (!settings?.deploy) {
        return
      }
      const filePath = this.pathForProjectFile(settings.deploy)
      const pathInProject = this.pathInProject(filePath)
      return { path: filePath, pathInProject }
    }

    async getBuiltContracts() {
      const settings = await this.checkSettings()
      const builtFolder = this.pathForProjectFile(
        settings.framework === 'hardhat' ? 'artifacts/contracts' : 'build/contracts'
      )
      let stopCriteria
      if (settings.framework === 'hardhat') {
        stopCriteria = child => child.type === 'file' && child.name.endsWith('.json') && !child.name.endsWith('.dbg.json')
      } else {
        stopCriteria = child => child.type === 'file' && child.name.endsWith('.json')
      }
      const files = await this.listFolderRecursively(builtFolder, stopCriteria)
      return files.map(f => ({ ...f, pathInProject: this.pathInProject(f.path) }))
    }

    async readProjectAbis() {
      const contracts = await this.getBuiltContracts()
      const abis = await Promise.all(contracts
        .map(contract => this.readFile(contract.path, 'utf8')
          .then(content => ({
            contractPath: contract.path,
            pathInProject: this.pathInProject(contract.path),
            content: JSON.parse(content)
          }))
          .catch(() => null)
        )
      )
      return abis
        .filter(Boolean)
        .map(({ contractPath, pathInProject, content }) => {
          const name = content.contractName || this.path.parse(contractPath).name
          return { contractPath, pathInProject, name, abi: content?.abi, content }
        })
    }

    checkSdkAndSigner(allParameters) {
      if (!networkManager.sdk) {
        notification.error(t('network.network.noNetwork'), t('network.network.noNetworkText'))
        return true
      }

      if (!allParameters.signer) {
        notification.error(t('contract.deploy.error'), t('contract.deploy.errorText'))
        return true
      }
    }

    validateDeployment(contractObj) {
      let bytecode = contractObj.bytecode || contractObj.evm?.bytecode?.object
      let deployedBytecode = contractObj.deployedBytecode || contractObj.evm?.deployedBytecode?.object

      if (!deployedBytecode) {
        notification.error(t('contract.deploy.error'), `Invalid <b>deployedBytecode</b> and <b>evm.deployedBytecode.object</b> fields in the built contract JSON. Please make sure you selected a correct built contract JSON file.`)
        return
      }
      if (!deployedBytecode) {
        notification.error(t('contract.deploy.error'), `Invalid <b>bytecode</b> and <b>evm.bytecode.object</b> fields in the built contract JSON. Please make sure you selected a correct built contract JSON file.`)
        return
      }
      if (!bytecode.startsWith('0x')) {
        bytecode = '0x' + bytecode
      }
      if (!deployedBytecode.startsWith('0x')) {
        deployedBytecode = '0x' + deployedBytecode
      }
      return {
        abi: contractObj.abi,
        bytecode,
        deployedBytecode
      }
    }

    async estimate(contractObj, allParameters) {
      if (this.checkSdkAndSigner(allParameters)) {
        return
      }
      const deploy = this.validateDeployment(contractObj)
      if (!deploy) {
        return
      }

      const { amount, parameters } = allParameters

      this.deployButton.setState({ pending: 'Estimating...' })

      let result
      try {
        const tx = await networkManager.sdk.getDeployTransaction({
          abi: deploy.abi,
          bytecode: deploy.bytecode,
          options: deploy.options,
          parameters: parameters.array,
          amount,
        }, {
          from: allParameters.signer,
        })
        result = await networkManager.sdk.estimate(tx)
      } catch (e) {
        console.warn(e)
        notification.error(t('contract.estimate.fail'), e.reason || e.message)
        this.deployButton.setState({ pending: false })
        return
      }

      this.deployButton.setState({ pending: false })

      return result
    }

    async pushDeployment(contractObj, allParameters) {
      if (this.checkSdkAndSigner(allParameters)) {
        return
      }
      const deploy = this.validateDeployment(contractObj)
      if (!deploy) {
        return
      }

      this.deployButton.setState({ pending: `${t('contract.deploy.deploying')}...`, result: '' })

      const networkId = networkManager.sdk.networkId
      const { contractName, amount, parameters, ...override } = allParameters
      const codeHash = networkManager.sdk.utils.sign.sha3(deploy.deployedBytecode)

      let result
      try {
        const tx = await networkManager.sdk.getDeployTransaction({
          abi: deploy.abi,
          bytecode: deploy.bytecode,
          options: deploy.options,
          parameters: parameters.array,
          amount,
        }, {
          from: allParameters.signer,
          ...override
        })

        result = await new Promise((resolve, reject) => {
          queue.add(
            () => networkManager.sdk.sendTransaction(tx),
            {
              title: t('contract.deploy.aContract'),
              name: 'Deploy',
              contractName,
              signer: allParameters.signer,
              abi: deploy.abi,
              value: networkManager.sdk.utils.unit.toValue(amount || '0'),
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
        notification.error(t('contract.deploy.fail'), e.reason || e.message)
        this.deployButton.setState({ pending: false })
        return
      }

      this.deployButton.setState({ pending: false })
      notification.success(t('contract.deploy.success'))

      redux.dispatch('ABI_ADD', {
        ...deploy.options,
        name: contractName,
        codeHash: result.codeHash,
        abi: JSON.stringify(deploy.abi),
      })

      const deployResultPath = this.path.join(this.projectRoot, 'deploys', `${result.network}_${moment().format('YYYYMMDD_HHmmss')}.json`)
      await this.ensureFile(deployResultPath)
      await this.saveFile(deployResultPath, JSON.stringify(result, null, 2))
    }
  }
}

export default {
  Local: makeProjectManager(ProjectManager.Local),
  Remote: makeProjectManager(ProjectManager.Remote),
}