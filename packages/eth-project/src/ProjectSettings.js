import { ProjectSettings } from '@obsidians/workspace'

export default class ExtendedProjectSettings extends ProjectSettings {
  static configFileName = 'config.json'

  constructor (settingFilePath, channel) {
    super(settingFilePath, channel)
  }

  trimSettings = (rawSettings = {}) => {
    const compilers = rawSettings.compilers || {}
    return {
      main: rawSettings.main || './contracts/Contract.sol',
      deploy: rawSettings.deploy || './build/contracts/Contract.json',
      compilers: {
        [process.env.COMPILER_VERSION_KEY]: compilers[process.env.COMPILER_VERSION_KEY] || '',
        solc: compilers.solc || '',
      }
    }
  }
}
