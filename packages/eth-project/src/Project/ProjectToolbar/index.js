import React, { PureComponent } from 'react'

import { WorkspaceContext } from '@obsidians/workspace'
import { ToolbarButton } from '@obsidians/ui-components'
import { CompilerButton } from '@obsidians/eth-compiler'

import DeployButton from './DeployButton'

export default class ProjectToolbar extends PureComponent {
  static contextType = WorkspaceContext

  render () {
    const { projectSettings, projectManager } = this.context
    const compilers = projectSettings?.get('compilers') || {}

    return <>
      <CompilerButton
        className='rounded-0 border-0 flex-none w-5'
        truffle={compilers[process.env.COMPILER_VERSION_KEY]}
        solc={compilers.solc}
        onClick={() => projectManager.compile()}
      />
      <DeployButton projectManager={projectManager} />
      <div className='flex-1' />
      <ToolbarButton
        id='settings'
        icon='fas fa-cog'
        tooltip='Project Settings'
        onClick={() => projectManager.openProjectSettings()}
      />
    </>
  }
}
