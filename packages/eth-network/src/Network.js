import React from 'react'

import LocalNetwork from './LocalNetwork'
import RemoteNetwork from './RemoteNetwork'

export default props => {
  const { active, network = 'dev' } = props
  
  if (network === 'dev') {
    return <LocalNetwork chain={network} active={active} />
  }
  return (
    <RemoteNetwork chain={network} />
  )
}
