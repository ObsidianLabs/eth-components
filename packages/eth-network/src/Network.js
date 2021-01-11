import React from 'react'

import LocalNetwork from './LocalNetwork'
import RemoteNetwork from './RemoteNetwork'

export default props => {
  const { active, network = 'dev', minerKey, minerTerminal } = props
  
  if (network === 'dev') {
    return <LocalNetwork chain={network} active={active} minerKey={minerKey} minerTerminal={minerTerminal} />
  }
  return (
    <RemoteNetwork chain={network} />
  )
}
