import Workspace from '@obsidians/workspace'
import platform from '@obsidians/platform'
import fileOps from '@obsidians/file-ops'
import { useBuiltinCustomTabs, modelSessionManager, defaultModeDetector } from '@obsidians/code-editor'
import compilerManager, { CompilerTerminal } from '@obsidians/compiler'

import ProjectManager from '../ProjectManager'

import ProjectToolbar from './ProjectToolbar'
import ProjectSettingsTab from './ProjectSettingsTab'

import addSolidityLanguage from './languages/solidity'

useBuiltinCustomTabs(['markdown'])
modelSessionManager.registerCustomTab('settings', ProjectSettingsTab, 'Project Settings')
modelSessionManager.registerModeDetector(filePath => {
  const { base } = fileOps.current.path.parse(filePath)
  if (base === 'config.json') {
    return 'settings'
  } else if (base.endsWith('.sol')) {
    return 'solidity'
  } else {
    return defaultModeDetector(filePath)
  }
})

const makeContextMenu = (contextMenu, projectManager) => node => {
  if (node.children) {
    return contextMenu
  }
  if (node.name.endsWith('.json')) {
    const cloned = [...contextMenu]
    cloned.splice(platform.isDesktop ? 5: 3, 0, {
      text: 'Deploy',
      onClick: () => projectManager.deploy(node.path),
    }, null)
    return cloned
  } else if (node.name.endsWith('.sol') && platform.isDesktop) {
    const cloned = [...contextMenu]
    cloned.splice(platform.isDesktop ? 5: 3, 0, {
      text: 'Compile',
      onClick: () => projectManager.compile(node.path),
    }, null)
    return cloned
  }
  return contextMenu
}

Workspace.defaultProps = {
  ProjectManager,
  compilerManager,
  ProjectToolbar,
  CompilerTerminal,
  addLanguages: () => addSolidityLanguage(),
  makeContextMenu,
}

export default Workspace
