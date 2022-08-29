import React from 'react'
import {
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  UncontrolledTooltip
} from '@obsidians/ui-components'
import RpcClientModal from './RpcClientModal'
import networkManager from '../networkManager'
import notification from '@obsidians/notification'
import { t } from '@obsidians/i18n'
import classnames from 'classnames'

export default function NetworkStatus(props) {
  const rpcModal = React.useRef()
  const { networkId, current: network } = networkManager
  const { connected } = props
  const [dropdownOpen, setDropdownOpen] = React.useState(false)

  const toggle = () => setDropdownOpen(!dropdownOpen)

  const handleRefreshNetwork = () => {
    if (!connected) {
      networkManager.reconnectNetwork()
    }
    props.onRefresh && props.onRefresh()
    connected && notification.error(t('network.network.network'), t('network.network.networkDisconnect'))
  }

  return <>
    <UncontrolledButtonDropdown direction='up' isOpen={dropdownOpen} toggle={toggle}>
      <DropdownToggle size='sm' color='default' id='network-tools' className='rounded-0 px-2 text-muted'>
        <div className='text-overflow-dots' style={{width: '7.5rem'}}>
          <span hidden={!network || !connected || networkId === 'dev' || networkId === 'custom'} 
            key={`network-${networkId}`} 
            className={`${classnames(`${networkId != 'dev' && networkId != 'custom' && 'd-inline-block'} mr-1`, connected ? 'color-success' : '')}`}
          >
            <i className='fas fa-wifi mr-1' />
          </span>{network ? network.name : t('network.network.noNetwork')}
        </div>
        {
          !dropdownOpen &&
          <UncontrolledTooltip placement='bottom' target='network-tools'>
            {t('network.network.Tools')}
          </UncontrolledTooltip>
        }
      </DropdownToggle>
      <DropdownMenu className='dropdown-menu-sm'>
        <DropdownItem header>
          <i className='fas fa-hammer mr-1' /> {t('network.network.tools')}
        </DropdownItem>
        <DropdownItem onClick={() => rpcModal.current?.openModal()}>
          {t('rpc.client')}
        </DropdownItem>
        {
          (!connected && networkId !== 'dev' && networkId !== 'custom' && network) && <DropdownItem onClick={handleRefreshNetwork}>
            {connected ? t('network.network.disconnect') : t('network.network.reconnect')}
          </DropdownItem>
        }
      </DropdownMenu>
    </UncontrolledButtonDropdown>
    <RpcClientModal ref={rpcModal} />
  </>
}
