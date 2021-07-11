import { ProjectSettings } from '@obsidians/workspace'

export default class ExtendedProjectSettings extends ProjectSettings {
  static configFileName = 'config.json'

  constructor (projectManager, settingFilePath, channel) {
    super(projectManager, settingFilePath, channel)
  }

  trimSettings = (rawSettings = {}) => {
    const compilers = rawSettings.compilers || {}
    const settings = {
      main: rawSettings.main || './contracts/Contract.sol',
      deploy: rawSettings.deploy || './build/contracts/Contract.json',
      compilers: {
        ...compilers,
        [process.env.COMPILER_VERSION_KEY]: compilers[process.env.COMPILER_VERSION_KEY] || '',
        solc: compilers.solc || '',
        evmVersion: compilers.evmVersion || 'istanbul',
        optimizer: compilers.optimizer,
      },
      linter: rawSettings.linter || 'solhint',
    }
    if (rawSettings.language) {
      settings.language = rawSettings.language
    }
    return settings
  }

  async set (key, value) {
    await super.set(key, value)
    if (key === 'compilers.solc') {
      this.projectManager.lint()
    }
  }
}
