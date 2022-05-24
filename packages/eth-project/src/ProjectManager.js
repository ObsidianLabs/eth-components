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
      console.log(filePath, pathInProject)

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
      console.log('contractObj', contractObj)
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
      console.log(allParameters, 'allParameters')
      if (this.checkSdkAndSigner(allParameters)) {
        return
      }
      const deploy = this.validateDeployment(contractObj)
      console.log(deploy)
      if (!deploy) {
        return
      }

      this.deployButton.setState({ pending: `${t('contract.deploy.deploying')}...`, result: '' })

      const networkId = networkManager.sdk.networkId
      const { contractName, amount, parameters, ...override } = allParameters

      // const codeHash = networkManager.sdk.utils.sign.sha3(deploy.deployedBytecode.toString())
      
      let result
      try {
        const tx = await networkManager.sdk.getDeployTransaction({
          abi: deploy.abi,
          bytecode: 'AGFzbQEAAAABtgItYAAAYAN/f38Bf2ADf35/AX5gBH9/f38AYAF/AGACf38Bf2AAAX9gAn9/AGABfgBgAn99AGAFf35+fn4AYAJ/fABgBH5+fn4Bf2ACfn4BfGACfn4BfWADf39/AGAEf39/fwF/YAN+f38Bf2AMf39/f39/f39/f39/AGACf38BfmAJf39+f39/f39/AX9gAAF+YAJ+fgF+YAJ/fgBgBn9/f39/fwF/YAN+fn4AYAF/AX9gBH9/f34BfmADf39/AX5gAnx/AXxgAn5+AX9gAXwBfGAEf35+fwBgAn9/AX1gAn9/AXxgAn5/AX9gBX9/f39/AX9gC39/f39/f39/f39/AX9gB39/f39/f38AYAJ+fgBgA39+fwBgBX9/f39/AGAGf39/f39/AGAEf35+fgBgBH9/f34AAtcJOwNlbnYQYWN0aW9uX2RhdGFfc2l6ZQAGA2Vudg13YXNtaW9fYXNzZXJ0AAcDZW52Bm1lbXNldAABA2VudgdtZW1tb3ZlAAEDZW52EHJlYWRfYWN0aW9uX2RhdGEABQNlbnYGbWVtY3B5AAEDZW52BnByaW50cwAEA2VudgVhYm9ydAAAA2VudgZwcmludGkACANlbnYNX19leHRlbmRzZnRmMgAJA2VudghfX211bHRmMwAKA2VudgtfX2Zsb2F0c2l0ZgAHA2VudghfX2FkZHRmMwAKA2Vudg1fX2V4dGVuZGRmdGYyAAsDZW52B19fZ2V0ZjIADANlbnYNX19mbG9hdHVuc2l0ZgAHA2VudghfX2RpdnRmMwAKA2VudgdfX2VxdGYyAAwDZW52B19fbGV0ZjIADANlbnYHX19uZXRmMgAMA2VudghfX3N1YnRmMwAKA2VudgxfX3RydW5jdGZkZjIADQNlbnYMX190cnVuY3Rmc2YyAA4DZW52CHByaW50c19sAAcDZW52DHV0aWxzX2Fzc2VydAAPA2VudgtjaGFpbl9zdG9yZQAQA2VudgljaGFpbl9kZWwABQNlbnYUY2hhaW5fZ2V0X2Jsb2NrX2hhc2gAEQNlbnYKY2hhaW5fdGxvZwASA2VudhJjaGFpbl90aGlzX2FkZHJlc3MABQNlbnYRY2hhaW5fZ2V0X2JhbGFuY2UAEwNlbnYNY2hhaW5fcGF5Y29pbgAUA2VudiBzZXRfYmxvY2tjaGFpbl9wYXJhbWV0ZXJzX3BhY2tlZAAHA2VudiBnZXRfYmxvY2tjaGFpbl9wYXJhbWV0ZXJzX3BhY2tlZAAFA2VudhZzZXRfcHJvcG9zZWRfcHJvZHVjZXJzABMDZW52DGN1cnJlbnRfdGltZQAVA2VudhRnZXRfYWN0aXZlX3Byb2R1Y2VycwAFA2VudhVjaGFpbl9ibG9ja190aW1lc3RhbXAAFQNlbnYSY2hhaW5fYmxvY2tfbnVtYmVyABUDZW52EmNoYWluX3R4X2luaXRpYXRvcgAFA2Vudg9jaGFpbl90eF9zZW5kZXIABQNlbnYSY2hhaW5fdHhfZ2FzX3ByaWNlABUDZW52DWNoYWluX3R4X2hhc2gABQNlbnYSY2hhaW5fdHhfZmVlX2xpbWl0ABUDZW52E2NoYWluX21zZ19pbml0aWF0b3IABQNlbnYQY2hhaW5fbXNnX3NlbmRlcgAFA2VudhVjaGFpbl9tc2dfY29pbl9hbW91bnQAFQNlbnYPY2hhaW5fbXNnX25vbmNlABUDZW52GWNoYWluX21zZ19vcGVyYXRpb25faW5kZXgAFQNlbnYJdXRpbHNfbG9nAAcDZW52D3V0aWxzX2ludDY0X2FkZAAWA2Vudg91dGlsc19pbnQ2NF9zdWIAFgNlbnYPdXRpbHNfaW50NjRfbXVsABYDZW52D3V0aWxzX2ludDY0X21vZAAWA2Vudg91dGlsc19pbnQ2NF9kaXYAFgNlbnYTdXRpbHNfYWRkcmVzc19jaGVjawABA2VudhJ3YXNtaW9fYXNzZXJ0X2NvZGUAFwNlbnYKY2hhaW5fbG9hZAAQA2VudhpjaGFpbl9nZXRfYWNjb3VudF9tZXRhZGF0YQAYA8ABvgEAGRoFBAAaBgUBGgQBAQEBARoBAQQEBhoEABoaFxobHBwBAQUaHAEcAQEdCh4KHyADEyEiDyEBIg8FBSMDJAMlAxABBRoFAQUBBQUaBQEFBRoBASQPEAEQBAUmBwcXGgQIBwQnBwUnBQMFJwMnDycoJyYnKQ8BJw8nKicmBwcFJyoHJykHJwMHJycEJwQnBCcEJwQnBCcEJwQnBCcEJwQnBCcEJycrJysnKycrJysnLCcEJCcaABoEGgcEBAEHBAUBcAEUFAUDAQABBhYDfwFBgMAAC38AQcPnAAt/AEHD5wALBwkBBWFwcGx5ADwJIQEAQQELE2FxeXt3kQEdJygqLC3xAfIB8wH0AfUB9gH3AQq38gO+AQQAEEAL3wcAIAAQmwEQOyAAIAFRBEBCgICAgICAgMDrACACUQRAIAAgARCeAQVCgICgsui4uqbDACACUQRAIAAgARChAQVCgIDqpbO8uqbDACACUQRAIAAgARClAQVCgICAiNW0uqbDACACUQRAIAAgARCnAQVCgICgw82GorQ8IAJRBEAgACABEKkBBUKAgICj47y6psMAIAJRBEAgACABEKsBBUKAgICwspOZ2ZJ/IAJRBEAgACABEK0BBUKAgICAlLSa0TkgAlEEQCAAIAEQsQEFQoCAgICmx6LeqX8gAlEEQCAAIAEQswEFQoCAgIimx6LeqX8gAlEEQCAAIAEQtQEFQoCAgJCmx6LeqX8gAlEEQCAAIAEQugEFQoCAgJimx6LeqX8gAlEEQCAAIAEQvQEFQoCAgKCmx6LeqX8gAlEEQCAAIAEQwAEFQoCAgKimx6LeqX8gAlEEQC',
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
                  // codeHash,
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
      console.log(result, '123123123')
      console.log(deploy, '12312====4123')
      redux.dispatch('ABI_ADD', {
        ...deploy.options,
        name: contractName,
        // use address instead
        codeHash: result.receipt.contractCreated,
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