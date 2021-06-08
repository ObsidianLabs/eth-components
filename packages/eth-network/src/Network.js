import React from 'react'

import { connect } from '@obsidians/redux'

import networkManager from './networkManager'
import LocalNetwork from './LocalNetwork'
import CustomNetwork from './CustomNetwork'
import RemoteNetwork from './RemoteNetwork'
import { default as DefaultCustomNetworkModal } from './CustomNetwork/CustomNetworkModal'

export default connect(['network', 'globalConfig'])(props => {
  const {
    network: networkId = 'dev',
    globalConfig,
    configButton,
    tabs,
    minerKey,
    CustomNetworkModal = DefaultCustomNetworkModal,
    cacheLifecycles,
  } = props

  const [active, setActive] = React.useState(true)
  React.useEffect(() => {
    cacheLifecycles.didCache(() => setActive(false))
    cacheLifecycles.didRecover(() => setActive(true))
  })

  const customNetwork = globalConfig.get('customNetwork')
  
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
        CustomNetworkModal={CustomNetworkModal}
      />
    )
  } else {
    const url = networkManager.sdk?.url
    return <RemoteNetwork networkId={networkId} url={url} />
  }
})
