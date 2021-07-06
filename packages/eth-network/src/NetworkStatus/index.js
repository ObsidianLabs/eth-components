import React, { PureComponent } from 'react'

import {
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from '@obsidians/ui-components'

import { networks } from '@obsidians/sdk'

import RpcClientModal from './RpcClientModal'

export default class NetworkStatus extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
    }
    this.rpcModal = React.createRef()
  }

  render () {
    const { network: networkId } = this.props

    const network = networks.find(n => n.id === networkId)

    const icon = (
      <div key={`network-${networkId}`} className='d-inline-block mr-1'>
        <i className={network?.icon} />
      </div>
    )

    return <>
      <UncontrolledButtonDropdown direction='up'>
        <DropdownToggle size='sm' color='default' className='rounded-0 px-2 text-muted'>
          {icon}{network?.name}
        </DropdownToggle>
        <DropdownMenu className='dropdown-menu-sm'>
          <DropdownItem header>
            <i className='fas fa-hammer mr-1' />network tools
          </DropdownItem>
          <DropdownItem onClick={() => this.rpcModal.current?.openModal()}>
            RPC Client
          </DropdownItem>
        </DropdownMenu>
      </UncontrolledButtonDropdown>
      <RpcClientModal ref={this.rpcModal} />
    </>
  }
}

