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

  const handleRefreshNetwork = () => {
    if (!connected) {
      networkManager.reconnectNetwork()
    }
    props.onRefresh && props.onRefresh()
    connected && notification.error(t('network.network.network'), t('network.network.networkDisconnect'))
  }

  return <>
    <UncontrolledButtonDropdown direction='up'>
      <DropdownToggle size='sm' color='default' id='network-tools' className='rounded-0 px-2 text-muted'>
        <span hidden={networkId == 'dev' || networkId == 'custom'} key={`network-${networkId}`} className={`${classnames(`${networkId != 'dev' && networkId != 'custom' && 'd-inline-block'} mr-1`, connected ? 'color-success' : '')}`}>
          <i className='fas fa-wifi mr-1' />
        </span>{network ? network.name : t('network.network.noNetwork')}
        <UncontrolledTooltip placement='bottom' target='network-tools'>
          {t('network.network.Tools')}
        </UncontrolledTooltip>
      </DropdownToggle>
      <DropdownMenu className='dropdown-menu-sm'>
        <DropdownItem header>
          <i className='fas fa-hammer mr-1' /> {t('network.network.tools')}
        </DropdownItem>
        <DropdownItem onClick={() => rpcModal.current?.openModal()}>
          {t('rpc.client')}
        </DropdownItem>
        {
          (networkId !== 'dev' && networkId !== 'custom' && network) && <DropdownItem onClick={handleRefreshNetwork}>
            {connected ? t('network.network.disconnect') : t('network.network.reconnect')}
          </DropdownItem>
        }
      </DropdownMenu>
    </UncontrolledButtonDropdown>
    <RpcClientModal ref={rpcModal} />
  </>
}
