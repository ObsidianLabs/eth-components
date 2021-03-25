import platform from '@obsidians/platform'
import { t } from '@obsidians/i18n'
import { DockerImageChannel } from '@obsidians/docker'
import notification from '@obsidians/notification'
import fileOps from '@obsidians/file-ops'
import semver from 'semver'

import SolcjsCompiler from './SolcjsCompiler'

class SolcjsChannel extends DockerImageChannel {
  installed () {
    return true
  }

  versions () {
    const versions = Object.keys(window.soljsonReleases).map(Tag => ({ Tag }))
    const event = new CustomEvent('versions', { detail: versions })
    this.eventTarget.dispatchEvent(event)
    return versions
  }
}

export class CompilerManager {
  static button = null
  static terminal = null
  static truffleTerminal = null

  constructor () {
    this.truffle = new DockerImageChannel(process.env.DOCKER_IMAGE_COMPILER)
    if (platform.isDesktop) {
      this.solc = new DockerImageChannel('ethereum/solc', {
        filter: v => semver.valid(v) && !v.endsWith('alpine'),
        size: 50,
      })
    } else {
      this.solc = new SolcjsChannel()
    }
    this.notification = null
    if (platform.isWeb) {
      this.solcjsCompiler = new SolcjsCompiler()
    }
  }

  get projectRoot () {
    if (!CompilerManager.terminal) {
      throw new Error('CompilerTerminal is not instantiated.')
    }
    return CompilerManager.terminal.props.cwd
  }

  focus () {
    if (CompilerManager.terminal) {
      CompilerManager.terminal.focus()
    }
  }

  async cacheSolcBin (url, version) {
    const cacheStorage = await window.caches.open('solcjs')
    const cached = await cacheStorage.match(url)

    if (cached) {
      return
    }

    this.notification = notification.info(t('compiler.downloadingSolc'), t('compiler.downloadingSolcMessage', { verion }), 0)
    const request = new Request(url, { mode: 'no-cors' })
    const response = await fetch(request)
    await cacheStorage.put(url, response)
    this.notification.dismiss()
  }

  async buildBySolcjs (projectManager) {
    if (!await projectManager.isMainValid) {
      notification.error(t('compiler.error.noMainFile'), t('compiler.error.noMainFileMessage'))
      throw new Error('No Main File.')
    }

    const solcVersion = projectManager.projectSettings.get('compilers.solc')
    const solcFileName = window.soljsonReleases[solcVersion]
    const solcUrl = `https://solc-bin.ethereum.org/bin/${solcFileName}`

    CompilerManager.button.setState({ building: true })
    await this.cacheSolcBin(solcUrl, solcFileName)

    CompilerManager.terminal.writeCmdToTerminal(`solcjs --bin ${projectManager.projectSettings.get('main')}`, `[${solcFileName}]`)
    this.notification = notification.info(t('compiler.build.building'), t('compiler.build.buildingMessage'), 0)
    const output = await this.solcjsCompiler.compile(solcUrl, projectManager)

    if (!output) {
      this.notification.dismiss()
      notification.error(t('compiler.error.buildFailed'), ``)
      CompilerManager.button.setState({ building: false })
      throw new Error('Build Failed.')
    }

    if (output.contracts) {
      for (const file in output.contracts) {
        for (const contractName in output.contracts[file]) {
          const json = output.contracts[file][contractName]
          const contractJsonPath = projectManager.pathForProjectFile(`build/contracts/${contractName}.json`)
          const contractJson = JSON.stringify(json, null, 2)
          await fileOps.current.writeFile(contractJsonPath, contractJson)
        }
      }
      projectManager.refreshDirectory()
      projectManager.refreshDirectory(projectManager.pathForProjectFile('build/contracts'))
    }

    let hasError = false
    output.errors?.forEach(error => {
      let color
      if (error.severity === 'error') {
        hasError = true
        color = '--color-danger'
      } else if (error.severity === 'warning') {
        color = '--color-warning'
      }
      CompilerManager.terminal.writeToTerminal(error.type, color)
      CompilerManager.terminal.writeToTerminal(`${error.formattedMessage.replace(error.type, '').replace(/\n/g, '\n\r')}`)
    })

    this.notification.dismiss()
    CompilerManager.button.setState({ building: false })
    if (hasError) {
      notification.error(t('compiler.error.buildFailed'), t('compiler.error.codeError'))
    } else {
      notification.success(t('compiler.build.success'), t('compiler.build.successMessage'))
    }
  }

  async build (settings, projectManager) {
    if (platform.isWeb) {
      return await this.buildBySolcjs(projectManager)
    }

    const { compilers = {} } = settings

    const projectRoot = this.projectRoot

    if (!compilers || !compilers[process.env.COMPILER_VERSION_KEY]) {
      notification.error(t('compiler.error.noVersion', { compiler: process.env.COMPILER_NAME }), t('compiler.error.noVersionMessage', { compiler: process.env.COMPILER_NAME }))
      throw new Error(`No ${process.env.COMPILER_NAME} version.`)
    }

    const allVersions = await this.truffle.versions()
    if (!allVersions.find(v => v.Tag === compilers[process.env.COMPILER_VERSION_KEY])) {
      notification.error(t('compiler.error.notInstall', { compiler: process.env.COMPILER_NAME, version: compilers[process.env.COMPILER_VERSION_KEY] }), t('compiler.error.notInstallMessage', { compiler: process.env.COMPILER_NAME }))
      throw new Error(`${process.env.COMPILER_NAME} version not installed`)
    }

    // if (!compilers.solc) {
    //   notification.error('No Solc Version', `Please select a version for solc in project settings.`)
    //   throw new Error('No solc version.')
    // }

    const allSolcVersions = await this.solc.versions()
    if (compilers.solc && compilers.solc !== 'default' && !allSolcVersions.find(v => v.Tag === compilers.solc)) {
      notification.error(t('compiler.error.solcNotInstall', { solc: compilers.solc }), t('compiler.error.solcNotInstallMessage'))
      throw new Error('Solc version not installed')
    }

    CompilerManager.button.setState({ building: true })
    CompilerManager.switchCompilerConsole('terminal')
    this.notification = notification.info(t('compiler.build.building'), t('compiler.build.buildingMessage'), 0)

    const cmd = this.generateBuildCmd({ projectRoot, settings })
    const result = await CompilerManager.terminal.exec(cmd)
    if (result.code) {
      CompilerManager.button.setState({ building: false })
      this.notification.dismiss()
      notification.error(t('compiler.error.buildFailed'), t('compiler.error.codeError'))
      throw new Error(result.logs)
    }

    CompilerManager.button.setState({ building: false })
    this.notification.dismiss()

    notification.success(t('compiler.build.success'), t('compiler.build.successMessage'))
  }

  static async stop () {
    if (CompilerManager.terminal) {
      CompilerManager.terminal.execAsChildProcess(`docker stop -t 1 truffle-compile`)
      await CompilerManager.terminal.stop()
    }
  }

  generateBuildCmd ({ projectRoot, settings }) {
    const compilers = settings.compilers
    const projectDir = fileOps.current.getDockerMountPath(projectRoot)
    const cmd = [
      `docker run -t --rm --name truffle-compile`,
      '-v /var/run/docker.sock:/var/run/docker.sock',
      `-v "${projectDir}:${projectDir}"`,
      `-w "${projectDir}"`,
      `${process.env.DOCKER_IMAGE_COMPILER}:${compilers[process.env.COMPILER_VERSION_KEY]}`,
      `${process.env.COMPILER_EXECUTABLE_NAME} compile`,
    ]

    if (compilers.solc && compilers.solc !== 'default') {
      cmd.push(`--compilers.solc.version '${compilers.solc}'`)
      cmd.push(`--compilers.solc.docker 1`)
    }

    return cmd.join(' ')
  }
}

export default new CompilerManager()
