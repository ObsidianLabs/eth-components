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
import classnames from 'classnames'

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
        <span key={`network-${networkId}`} className={`${classnames('d-inline-block mr-1', connected ? 'color-success' : '')}`}>
          <i className='fas fa-wifi mr-1' />
        </span>{network ? network.name : 'No Network'}
      </DropdownToggle>
      <DropdownMenu className='dropdown-menu-sm'>
        <DropdownItem header>
          <i className='fas fa-hammer mr-1' /> network tools
        </DropdownItem>
        <DropdownItem onClick={() => rpcModal.current?.openModal()}>
          RPC Client
        </DropdownItem>
        {
          (networkId !== 'dev' && network) && <DropdownItem onClick={handleRefreshNetwork}>
            {connected ? 'Disconnect' : 'Reconnect'}
          </DropdownItem>
        }
      </DropdownMenu>
    </UncontrolledButtonDropdown>
    <RpcClientModal ref={rpcModal} />
  </>
}
