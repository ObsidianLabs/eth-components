import React from 'react'

import {
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from '@obsidians/ui-components'

import RpcClientModal from './RpcClientModal'
import networkManager from '../networkManager'
import connectedIcon from '../assets/icon_connected.png'

export default function NetworkStatus (props) {
  const rpcModal = React.useRef()

  const { networkId, current: network } = networkManager

  const networkIcon = (network?.group === 'others' && network?.id !== 'custom') ? <img src={connectedIcon} className='network-icon' /> : <i className={network?.icon} />
  const icon = (
    <div key={`network-${networkId}`} className='d-inline-block mr-1'>
      {networkIcon}
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
        {
          networkId !== 'dev' && <DropdownItem onClick={handleRefreshNetwork}>
            {
              connected ? <span key='connect'><i className='fas fa-wifi mr-1' /></span> : <span key='disConnect'><i className='fas fa-wifi-slash mr-1' /></span>
            }
            {connected ? 'Disconnect' : 'Reconnect'}
          </DropdownItem>
        }
      </DropdownMenu>
    </UncontrolledButtonDropdown>
    <RpcClientModal ref={rpcModal} />
  </>
}
