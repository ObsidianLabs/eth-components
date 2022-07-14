import React from 'react'
import { withRouter, useParams } from 'react-router-dom'
import redux, { connect } from '@obsidians/redux'

import networkManager from './networkManager'
import LocalNetwork from './LocalNetwork'
import CustomNetwork from './CustomNetwork'
import RemoteNetwork from './RemoteNetwork'
import { default as DefaultCustomNetworkModal } from './CustomNetwork/CustomNetworkModal'

export default connect(['network', 'customNetworks', 'uiState', 'customNetworkModalStatus', 'networkConnect'])(withRouter(props => {
  const {
    network: networkId = 'dev',
    customNetworks,
    uiState,
    configButton,
    tabs,
    minerKey,
    CustomNetworkModal = DefaultCustomNetworkModal,
    cacheLifecycles,
    history,
    customNetworkModalStatus,
    networkConnect,
  } = props

  const [active, setActive] = React.useState(true)
  const [showCustomNetworkModal, setShowCustomNetworkModal] = React.useState(false)
  const [notificaStatus, setNotificaStatus] = React.useState(false)
  const customModal = React.createRef()
  const paramsNetworkValue = useParams()?.network

  const getRpcUrl = () => {
    const { metaMaskConnected, current } = networkManager
    return metaMaskConnected ? (current?.url || '') : (networkManager.sdk?.url || '')
  }

  
  React.useEffect(() => {
    (history.location.pathname?.startsWith('/network')) && redux.dispatch('LOAD_NETWORK_RESOURCES', true)
    if (customNetworkModalStatus) {
      setShowCustomNetworkModal(true)
      customModal.current?.openModal()
    }
  }, [customNetworkModalStatus])
  
  React.useEffect(() => {
    if (cacheLifecycles) {
      cacheLifecycles.didCache(() => setActive(false))
      cacheLifecycles.didRecover(() => setActive(true))
    }
  })

  React.useEffect(() => {
    if (networkId) {
      if (paramsNetworkValue && paramsNetworkValue !== networkId) {
        const paramsNetworkObj = networkManager.networks.find(item => item.id === paramsNetworkValue)
        paramsNetworkObj && !networkConnect && networkManager.setNetwork(paramsNetworkObj)
      }
      setNotificaStatus(true)
    }
  }, [networkId])

  const changeNotificaStatus = () => setNotificaStatus(false)

  function customNetworkModalBody() {
    return (
      <CustomNetworkModal
        ref={customModal}
        networkId={networkId}
        customNetworks={customNetworks}
        option={uiState.get('customNetworkOption')}
        openModal={showCustomNetworkModal}
      />
    )
  }

  if (networkId === 'dev') {
    return (
      <>
        <LocalNetwork
          networkId={networkId}
          active={active}
          configButton={configButton}
          tabs={tabs}
          minerKey={minerKey}
        />
        {customNetworkModalBody()}
      </>
    )
  } else {
    return <>
      <RemoteNetwork
        networkId={networkId}
        url={getRpcUrl()}
        notificaStatus={notificaStatus}
        changeStatus={changeNotificaStatus} />
      {customNetworkModalBody()}
    </>
  }
}))
