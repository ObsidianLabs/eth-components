import React, { PureComponent } from 'react'

import { WorkspaceContext } from '@obsidians/workspace'
import { ToolbarButton, DropdownToolbarButton } from '@obsidians/ui-components'
import { CompilerButton } from '@obsidians/compiler'
import keypairManager from '@obsidians/keypair'
import { withRouter } from 'react-router-dom'

import DeployButton from './DeployButton'
import ScriptsButton from './ScriptsButton'
import SignRequestModal from './SignRequestModal'
import ForkButton from './ForkButton'

export default withRouter(class ProjectToolbar extends PureComponent {
  constructor(props) {
    super(props)
  }

  static contextType = WorkspaceContext

  render () {
    const { signer, noBuild, noDeploy, ExtraButtons = () => null } = this.props
    const { projectSettings, projectManager, hasDeployFile = false } = this.context
    const compilers = projectSettings?.get('compilers') || {}
    const readOnly = !projectManager.userOwnProject && projectManager.remote
    const copiedUserProjectPath = projectSettings?.settingFilePath?.split('/')
    const [ , copiedUserId, copiedProjectId ] = copiedUserProjectPath



    return <>
      {
        !noBuild &&
        <CompilerButton
          className='rounded-0 border-0 flex-none w-5'
          truffle={compilers[process.env.COMPILER_VERSION_KEY]}
          solc={compilers.solc}
          onClick={() => projectManager.compile(null, this.props.finalCall)}
          readOnly={readOnly}
        />
      }
      {!noDeploy &&
        <DeployButton
        projectManager={projectManager}
        signer={signer}
        readOnly={readOnly && !hasDeployFile} />
      }
      <ScriptsButton
        projectManager={projectManager}
        readOnly={readOnly}/>
      { <ExtraButtons projectManager={projectManager} signer={signer} /> }
      <div className='flex-1' />
      {
        process.env.REACT_APP_PROJECT_SHARE_URL && readOnly &&
        <ForkButton {...this.props} projectManager={projectManager} copiedUserId={copiedUserId} copiedProjectId={copiedProjectId} />
      }
      <ToolbarButton
        id='settings'
        icon='fas fa-cog'
        tooltip='Project Settings'
        onClick={() => projectManager.openProjectSettings()}
      />
      <SignRequestModal ref={keypairManager.signReqModal} />
    </>
  }
})
