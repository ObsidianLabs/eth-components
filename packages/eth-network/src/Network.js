import React from 'react'

import LocalNetwork from './LocalNetwork'
import RemoteNetwork from './RemoteNetwork'

export default props => {
  const { active, network = 'dev', miner } = props
  
  if (network === 'dev' || network === 'local') {
    return <LocalNetwork chain={network} active={active} miner={miner} />
  }
  return (
    <RemoteNetwork chain={network} />
  )
}
