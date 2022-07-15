import React, { PureComponent } from 'react'

import {
  Modal,
  DebouncedFormGroup,
  Input,
  ToolbarButton,
} from '@obsidians/ui-components'

import notification from '@obsidians/notification'
import headerActions from '@obsidians/eth-header'

import { t } from '@obsidians/i18n'
import redux from '@obsidians/redux'
import debounce from 'lodash/debounce'

export default class ForkButton extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      pending: false,
      projectName: '',
      username: '',
      userId: '',
    }
    this.modal = React.createRef()
  }

  projectForkStatus = async () => {
    const getProjectInfo = await this.props.projectManager.getProjectInfo()
    if (getProjectInfo?.error) {
      notification.error(t('project.fork.connot'), t('project.fork.projectNotFound'))
      return false
    }
    return true
  }
  
  onClick = async () => {
    const status = await this.projectForkStatus()
    if (!status) return
    const profile = redux.getState().profile?.toJS()
    const username = profile.username
    const providers = process.env.LOGIN_PROVIDERS ? process.env.LOGIN_PROVIDERS.split(',') : ['github']
    if (!username) return headerActions.forkProjectNeedUserLogin(providers)
    const projectName = this.props.location.pathname.split('/').slice(-1)[0]
    this.setState({ username, projectName, userId: profile.userId, pending: false })
    this.modal.current.openModal()
  }

  confirmFork = async () => {
    this.setState({ pending: true })
    const { copiedUserId, copiedProjectId, projectManager } = this.props
    const { projectName, username } =  this.state

    const status = await this.projectForkStatus()
    if (!status) return this.setState({ pending: false })

    try {
      await projectManager.forkToPublic('public', copiedUserId, copiedProjectId, projectName)
    } catch (e) {
      notification.error('Fork Failed', e.message)
      return this.setState({ pending: false })
    }

    this.setState({ pending: false })
    notification.success('Fork successful', `New project <b>${projectName}</b> is created.`)
    this.modal.current.closeModal()
    this.props.history.push(`/${username}/${projectName}`)
  }

  render () {
    const { location } = this.props
    const { pending, projectName, username } = this.state
    const pathname = location?.pathname.startsWith('/') ? location?.pathname.substr(1) : location?.pathname

    let icon = <span key='fork-icon'><i class="fas fa-code-branch" /></span>
    if (pending) {
      icon = <span key='forking-icon'><i className='fas fa-spinner fa-pulse' /></span>
    }

    return <>
      <ToolbarButton 
        id='fork-project'
        tooltip='Fork Project'
        iconComponent={icon}
        onClick={debounce(this.onClick, 200)}/>
      <Modal
        ref={this.modal}
        title={'Fork Project'}
        textConfirm={!pending && ' Create Fork'}
        pending={pending && 'Creating Fork…'}
        onConfirm={this.confirmFork}
        confirmDisabled={!projectName || !/^[0-9a-zA-Z\-_]*$/.test(projectName)}
      >
        <div className='mt-2 small'>{t('project.fork.desc')}</div>
        <h5 className='mt-4'>Fork From</h5>
        <Input
          className='bg-black'
          placeholder={pathname}
          readOnly={true}
        />
        <h5 className='mt-4'>Fork To</h5>
        <DebouncedFormGroup
          labelStatus={false}
          addon={<span key='mode-name'>{username + '/'}</span>}
          addonClassnames={'pl-1 text-placeholder'}
          addonBtnClassnames='bg-black pl-1 pr-0'
          className='bg-black pl-0'
          formGroupClassName={'small'}
          value={projectName}
          onChange={projectName => this.setState({ projectName })}
          validator={v => !/^[0-9a-zA-Z\-_]*$/.test(v) && 'Fork project name can only contain letters, digits, dash or underscore.'}
        />
        <h5 className='mt-4'>Visibility</h5>
        <DebouncedFormGroup
          label={t('project.fork.visibilityDesc')}
          className='bg-black'
          formGroupClassName={'small'}
          placeholder={'Public'}
          readOnly={true}
        />
      </Modal>
    </>
  }
}
