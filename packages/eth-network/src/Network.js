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
    tabs,
    minerKey,
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
        tabs={tabs}
        minerKey={minerKey}
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
