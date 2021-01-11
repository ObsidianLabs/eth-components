import React from 'react'

import {
  SplitPane
} from '@obsidians/ui-components'

import { NodeTerminal } from '@obsidians/eth-node'
import InstanceList from './InstanceList'

export default function LocalNetwork (props) {
  const { active, chain, miner } = props
  return (
    <SplitPane
      split='horizontal'
      primary='second'
      defaultSize={260}
      minSize={200}
    >
      <InstanceList chain={chain} />
      <NodeTerminal active={active} miner={miner} />
    </SplitPane>
  )
}
