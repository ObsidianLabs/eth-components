import React from 'react'

import TruffleSelector from './TruffleSelector'
import SolcSelector from './SolcSelector'

export default props => {
  if (props.author === 'local') {
    return <>
      <TruffleSelector />
      <SolcSelector />
    </>
  }

  return <SolcSelector remote />
}
