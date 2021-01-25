import React from 'react'

import platform from '@obsidians/platform'
import TruffleSelector from './TruffleSelector'
import SolcSelector from './SolcSelector'

export default () => {
  if (platform.isDesktop) {
    return <>
      <TruffleSelector />
      <SolcSelector />
    </>
  }

  return <SolcSelector />
}
