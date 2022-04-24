import React from 'react'
import {
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from '@obsidians/ui-components'
import RpcClientModal from './RpcClientModal'
import networkManager from '../networkManager'
import notification from '@obsidians/notification'

export default function NetworkStatus(props) {
  const rpcModal = React.useRef()
  const { networkId, current: network } = networkManager
  const { connected } = props

  const handleRefreshNetwork = () => {
    if (!connected) {
      networkManager.reconnectNetwork()
    }
    props.onRefresh && props.onRefresh()
    connected && notification.error(`Network`, ` Network disconnect`)
  }

  return <>
    <UncontrolledButtonDropdown direction='up'>
      <DropdownToggle size='sm' color='default' className='rounded-0 px-2 text-muted'>
        <span key={`network-${networkId}`} className='d-inline-block mr-1'>
          <i className={network?.icon} />
        </span>{network?.name}
      </DropdownToggle>
      <DropdownMenu className='dropdown-menu-sm'>
        <DropdownItem header>
          network tools
        </DropdownItem>
        <DropdownItem onClick={() => rpcModal.current?.openModal()}>
          <i className='fas fa-hammer mr-1' /> RPC Client
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
