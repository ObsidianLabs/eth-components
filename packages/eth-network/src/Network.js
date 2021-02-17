import React from 'react'

import LocalNetwork from './LocalNetwork'
import { default as DefaultRemoteNetwork } from './RemoteNetwork'

export default props => {
  const {
    active,
    networkId = 'dev',
    configButton,
    minerKey,
    minerTerminal,
    RemoteNetwork = DefaultRemoteNetwork
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
  }
  return (
    <RemoteNetwork networkId={networkId} />
  )
}
