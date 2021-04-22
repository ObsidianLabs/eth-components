import React, { PureComponent } from 'react'

import {
  IconButton,
} from '@obsidians/ui-components'

export default class CustomNetwork extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      info: { url: '', option: '' },
    }
    this.modal = React.createRef()
  }

  componentDidMount () {
    if (!this.props.customNetwork) {
      this.modal.current.openModal()
    } else {
      this.modal.current.update(this.props.customNetwork)
    }
  }

  render () {
    const { networkId, customNetwork, RemoteNetwork, CustomNetworkModal } = this.props
    const { info } = this.state

    return <>
      <RemoteNetwork
        networkId={networkId}
        info={info}
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
        onUpdate={info => this.setState({ info })}
      />
    </>
  }
}
