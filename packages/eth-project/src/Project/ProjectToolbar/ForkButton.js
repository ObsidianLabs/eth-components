import React, { PureComponent } from 'react'

import {
  Modal,
  DebouncedFormGroup,
  Input,
  InputGroup,
  ToolbarButton,
} from '@obsidians/ui-components'

import notification from '@obsidians/notification'
import headerActions from '@obsidians/eth-header'

import { t } from '@obsidians/i18n'
import forkImg from '../../assets/icon_fork.png'
import redux from '@obsidians/redux'

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
  
  onClick = () => {
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

    try {
      await projectManager.forkToPublic('public', copiedUserId, copiedProjectId, projectName)
    } catch (e) {
      notification.error('Fork Failed', e.message)
      this.setState({ pending: false })
      return false
    }

    this.setState({ pending: false })
    notification.success('Fork successful', `New project <b>${projectName}</b> is created.`)
    this.modal.current.closeModal()
    this.props.history.push(`/${username}/${projectName}`)
  }

  onChange = event => {
    let projectName = event.target.value.replace(/[^0-9a-zA-Z-_$]/ig, "")
    this.setState({ projectName })
  }

  render () {
    const { location } = this.props
    const { pending, projectName, username } = this.state

    let icon = <span key='fork-icon'><img src={forkImg} className='network-icon' /></span>
    if (pending) {
      icon = <span key='forking-icon'><i className='fas fa-spinner fa-pulse' /></span>
    }

    return <>
      <ToolbarButton 
        id='fork-project'
        tooltip='Fork Project'
        iconComponent={icon}
        onClick={this.onClick}/>
      <Modal
        ref={this.modal}
        title={'Fork Project'}
        textConfirm={!pending && ' Create Fork'}
        pending={pending && 'Creating Fork…'}
        onConfirm={this.confirmFork}
        confirmDisabled={!projectName}
      >
        <div className='mt-2 small'>{t('project.fork.desc')}</div>
        <h5 className='mt-4'>Fork From</h5>
        <Input
          className='bg-black'
          placeholder={location?.pathname}
          readOnly={true}
        />
        <h5 className='mt-4'>Fork To</h5>
        <InputGroup className="pl-3 input-readonly-bg bg2">
          <div className='d-inline-block hover-inline text-placeholder'>
            {username + '/'}
          </div>
          <Input
            className='input-readonly-box-shadow pl-0'
            value={projectName}
            onChange={this.onChange}
          />
        </InputGroup>
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
