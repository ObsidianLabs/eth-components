import React, { PureComponent } from 'react'

import {
  Modal,
} from '@obsidians/ui-components'

import RpcActionForm from './RpcActionForm'

export default class RpcClientModal extends PureComponent {
  constructor (props) {
    super(props)
    this.modal = React.createRef()
  }

  openModal = () => {
    this.modal.current.openModal()
  }

  render () {
    return (
      <Modal ref={this.modal} h100 title='RPC Client'>
        <RpcActionForm />
      </Modal>
    )
  }
}