import Workspace from '@obsidians/workspace'
import fileOps from '@obsidians/file-ops'
import { useBuiltinCustomTabs, modelSessionManager, defaultModeDetector } from '@obsidians/code-editor'
import compilerManager, { CompilerTerminal } from '@obsidians/compiler'
import platform from '@obsidians/platform'
import ProjectManager from '../ProjectManager'

import ProjectToolbar from './ProjectToolbar'
import ProjectSettingsTab from './ProjectSettingsTab'

import addSolidityLanguage from './languages/solidity'
import findIndex from 'lodash/findIndex'

useBuiltinCustomTabs(['markdown'])
modelSessionManager.registerCustomTab('settings', ProjectSettingsTab, 'Project Settings')
modelSessionManager.registerModeDetector(filePath => {
    const { prefix, userId, projectId, settingsFilePath } = modelSessionManager.projectManager
    const { base } = fileOps.current.path.parse(filePath)
    const settingFilePath = platform.isDesktop ? settingsFilePath : `${prefix}/${userId}/${projectId}/config.json`
    const isRoot = settingFilePath === filePath

    if (base === 'config.json' && isRoot) {
      return 'settings'
    } else if (base.endsWith('.sol')) {
      return 'solidity'
    } else {
      return defaultModeDetector(filePath)
    }
})

const makeContextMenu = (contextMenu, projectManager) => node => {
  if(!node) {
    return []
  }

  // hide "Open" menu item when it`s a folder
  if (node.children) {
    const menus = [...contextMenu]
    const index = findIndex(contextMenu, item => item?.text === 'Open')
    if(index !== -1) {
      menus.splice(index, 2)
    }
    return menus
  }

  const { prefix, userId, projectId, projectRoot: localProjectRoot  } = modelSessionManager.projectManager
  const cloudProjectRoot = `${prefix}/${userId}/${projectId}`
  const buildFolderPath = `${projectManager.remote ? cloudProjectRoot : localProjectRoot}${projectManager.path.sep}build`
  const fileDeployStatus = node.path.includes(buildFolderPath)

  if (fileDeployStatus && node.name.endsWith('.json')) {
    const { dir, name } = projectManager.path.parse(node.path)
    if (!name.endsWith('.abi')) { // && dir.endsWith(path.join('build', 'contracts'))
      const cloned = [...contextMenu]
      cloned.splice(projectManager.remote ? 3 : 5, 0, {
        text: 'Deploy',
        onClick: () => projectManager.deploy(node),
      }, null)
      return cloned
    }
  } else if (node.name.endsWith('.sol')) {// && !projectManager.remote
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
