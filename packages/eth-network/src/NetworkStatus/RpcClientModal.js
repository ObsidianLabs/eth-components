import React, { PureComponent } from 'react'

import {
  Modal,
} from '@obsidians/ui-components'

import notification from '@obsidians/notification'
import { t } from '@obsidians/i18n'

import RpcActionForm from './RpcActionForm'
import networkManager from '../networkManager'

export default class RpcClientModal extends PureComponent {
  constructor (props) {
    super(props)
    this.modal = React.createRef()
  }

  openModal = () => {
    if (!networkManager.sdk) {
      notification.error(t('network.network.noNetwork'), t('network.network.noNetworkText'))
      return
    }
    this.modal.current.openModal()
  }

  render () {
    return (
      <Modal ref={this.modal} scrollable title={t('rpc.client')} textCancel={t('component.text.close')}>
        <RpcActionForm />
      </Modal>
    )
  }
}