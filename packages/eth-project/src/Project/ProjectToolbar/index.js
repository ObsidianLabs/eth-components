import React, { PureComponent } from 'react'

import { WorkspaceContext } from '@obsidians/workspace'
import { ToolbarButton } from '@obsidians/ui-components'
import { CompilerButton } from '@obsidians/compiler'
import keypairManager from '@obsidians/keypair'

import DeployButton from './DeployButton'
import SignRequestModal from './SignRequestModal'

export default class ProjectToolbar extends PureComponent {
  static contextType = WorkspaceContext

  render () {
    const { signer, noBuild, noDeploy, ExtraButtons = () => null } = this.props
    const { projectSettings, projectManager } = this.context
    const compilers = projectSettings?.get('compilers') || {}

    return <>
      {
        !noBuild &&
        <CompilerButton
          className='rounded-0 border-0 flex-none w-5'
          truffle={compilers[process.env.COMPILER_VERSION_KEY]}
          solc={compilers.solc}
          onClick={() => projectManager.compile()}
        />
      }
      { !noDeploy && <DeployButton projectManager={projectManager} signer={signer} /> }
      { <ExtraButtons projectManager={projectManager} signer={signer} /> }
      <div className='flex-1' />
      <ToolbarButton
        id='settings'
        icon='fas fa-cog'
        tooltip='Project Settings'
        onClick={() => projectManager.openProjectSettings()}
      />
      <SignRequestModal ref={keypairManager.signReqModal} />
    </>
  }
}
