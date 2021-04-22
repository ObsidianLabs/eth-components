import React from 'react'

import LocalNetwork from './LocalNetwork'
import CustomNetwork from './CustomNetwork'
import { default as DefaultRemoteNetwork } from './RemoteNetwork'
import { default as DefaultCustomNetworkModal } from './CustomNetwork/CustomNetworkModal'

export default props => {
  const {
    active,
    networkId = 'dev',
    configButton,
    minerKey,
    minerTerminal,
    RemoteNetwork = DefaultRemoteNetwork,
    CustomNetworkModal = DefaultCustomNetworkModal,
    customNetwork,
  } = props
  
  if (networkId === 'dev') {
    return (
      <LocalNetwork
        networkId={networkId}
        active={active}
        configButton={configButton}
        minerKey={minerKey}
        minerTerminal={minerTerminal}
      />
    )
  } else if (networkId.startsWith('custom')) {
    return (
      <CustomNetwork
        networkId={networkId}
        customNetwork={customNetwork}
        RemoteNetwork={RemoteNetwork}
        CustomNetworkModal={CustomNetworkModal}
      />
    )
  } else {
    return <RemoteNetwork networkId={networkId} />
  }
}
