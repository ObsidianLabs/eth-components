import Workspace from '@obsidians/workspace'
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
    const { dir, name } = projectManager.path.parse(node.path)
    if (!name.endsWith('.abi')) { // && dir.endsWith(path.join('build', 'contracts'))
      const cloned = [...contextMenu]
      cloned.splice(projectManager.remote ? 3 : 5, 0, {
        text: 'Deploy',
        onClick: () => projectManager.deploy(node),
      }, null)
      return cloned
    }
  } else if (node.name.endsWith('.sol') && !projectManager.remote) {
    const cloned = [...contextMenu]
    cloned.splice(projectManager.remote ? 3: 5, 0, {
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
  addLanguages: addSolidityLanguage,
  makeContextMenu,
}

export default Workspace
