import React from 'react'
import { withRouter } from 'react-router-dom'
import redux, { connect } from '@obsidians/redux'

import networkManager from './networkManager'
import LocalNetwork from './LocalNetwork'
import CustomNetwork from './CustomNetwork'
import RemoteNetwork from './RemoteNetwork'
import { default as DefaultCustomNetworkModal } from './CustomNetwork/CustomNetworkModal'

export default connect(['network', 'customNetworks', 'uiState', 'customNetworkModalStatus'])(withRouter(props => {
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
  } = props

  const [active, setActive] = React.useState(true)
  const [showCustomNetworkModal, setShowCustomNetworkModal] = React.useState(false)
  const customModal = React.createRef()

  
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
    const url = networkManager.sdk?.url
    return <>
      <RemoteNetwork networkId={networkId} url={url} />
      {customNetworkModalBody()}
    </>
  }
}))
