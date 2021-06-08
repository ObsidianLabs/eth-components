import React, { PureComponent } from 'react'

import {
  IconButton,
} from '@obsidians/ui-components'

import RemoteNetwork from '../RemoteNetwork'

export default class CustomNetwork extends PureComponent {
  constructor (props) {
    super(props)
    this.modal = React.createRef()
  }

  componentDidMount () {
    const { customNetwork } = this.props
    if (!customNetwork) {
      this.modal.current.openModal()
    } else {
      this.modal.current.update(customNetwork)
    }
  }

  render () {
    const {
      networkId,
      customNetwork,
      CustomNetworkModal,
      placeholder,
    } = this.props

    return <>
      <RemoteNetwork
        networkId={networkId}
        {...customNetwork}
        EditButton={
          <IconButton
            color='default'
            className='text-muted'
            icon='fas fa-cog'
            onClick={() => this.modal.current.openModal(customNetwork)}
          />
        }
      />
      <CustomNetworkModal
        ref={this.modal}
        placeholder={placeholder}
      />
    </>
  }
}
