import { ProjectSettings } from '@obsidians/workspace'

export default class ExtendedProjectSettings extends ProjectSettings {
  static configFileName = 'config.json'

  constructor (projectManager, settingFilePath, channel) {
    super(projectManager, settingFilePath, channel)
  }

  trimSettings = (rawSettings = {}) => {
    const compilers = rawSettings.compilers || {}
    return {
      language: rawSettings.language || '',
      main: rawSettings.main || './contracts/Contract.sol',
      deploy: rawSettings.deploy || './build/contracts/Contract.json',
      compilers: {
        ...compilers,
        [process.env.COMPILER_VERSION_KEY]: compilers[process.env.COMPILER_VERSION_KEY] || '',
        solc: compilers.solc || '',
      }
    }
  }
}
