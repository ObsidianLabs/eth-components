import React from 'react'
import { withRouter } from 'react-router-dom'
import { connect } from '@obsidians/redux'

import networkManager from './networkManager'
import LocalNetwork from './LocalNetwork'
import CustomNetwork from './CustomNetwork'
import RemoteNetwork from './RemoteNetwork'
import { default as DefaultCustomNetworkModal } from './CustomNetwork/CustomNetworkModal'

export default connect(['network', 'customNetworks', 'uiState'])(withRouter(props => {
  const {
    network: networkId = 'dev',
    customNetworks,
    uiState,
    configButton,
    tabs,
    minerKey,
    CustomNetworkModal = DefaultCustomNetworkModal,
    cacheLifecycles,
    history
  } = props

  const [active, setActive] = React.useState(true)
  const [showCustomNetworkModal, setShowCustomNetworkModal] = React.useState(false)

  
  React.useEffect(() => {
    if(history.location.pathname.endsWith('custom')) {
      setShowCustomNetworkModal(true)
    }
  }, [history])
  
  React.useEffect(() => {
    if (cacheLifecycles) {
      cacheLifecycles.didCache(() => setActive(false))
      cacheLifecycles.didRecover(() => setActive(true))
    }
  })

  if (networkId === 'dev') {
    return (
      <LocalNetwork
        networkId={networkId}
        active={active}
        configButton={configButton}
        tabs={tabs}
        minerKey={minerKey}
      />
    )
  } else if (networkId.startsWith('custom')) {
    return (
      <CustomNetwork
        networkId={networkId}
        option={uiState.get('customNetworkOption')}
        customNetworks={customNetworks}
        CustomNetworkModal={CustomNetworkModal}
        openModal={showCustomNetworkModal}
      />
    )
  } else {
    const url = networkManager.sdk?.url
    return <RemoteNetwork networkId={networkId} url={url} />
  }
}))
