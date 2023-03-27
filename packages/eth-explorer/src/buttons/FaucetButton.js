import React, { PureComponent } from 'react'
import { networkManager } from '@obsidians/eth-network'
import { ToolbarButton } from '@obsidians/ui-components'

import fileOps from '@obsidians/file-ops'

export default class FaucetButton extends PureComponent {
  constructor (props) {
    super(props)
  }

  openAccount = async () => {
    const explorer = networkManager.sdk.client.explorer
    fileOps.current.openLink(`${explorer}/account/${this.props.address}`)
  }

  render() {
    return (
      <ToolbarButton
        id='navbar-faucet'
        size='md'
        icon='fas fa-external-link-alt'
        tooltip='打开浏览器账户页面'
        onClick={this.openAccount}
      />
    )
  }
}
