import React, { PureComponent } from 'react'

import {
  ToolbarButton,
} from '@obsidians/ui-components'

import { networkManager } from '@obsidians/eth-network'

export default class FaucetButton extends PureComponent {

  convert = () => {
    const convertedAddress = networkManager.sdk.convertAddress(this.props.address)
    this.props.onChange(convertedAddress)
  }

  render () {
    if (process.env.PROJECT !== 'conflux' || !networkManager.sdk?.isValidAddress(this.props.address)) {
      return null
    }
    return (
      <ToolbarButton
        id='navbar-convert'
        size='md'
        icon='fas fa-repeat'
        tooltip='Convert'
        onClick={this.convert}
      />
    )
  }
}
