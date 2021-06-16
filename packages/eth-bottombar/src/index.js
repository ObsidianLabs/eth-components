import React from 'react'
import CacheRoute from 'react-router-cache-route'

import { connect } from '@obsidians/redux'

import Auth from '@obsidians/auth'
import { KeypairButton } from '@obsidians/keypair'
import { TerminalButton } from '@obsidians/workspace'

import { NetworkStatus } from '@obsidians/eth-network'
import { QueueButton } from '@obsidians/eth-queue'
import { AbiStorage } from '@obsidians/eth-contract'
import { CompilerSelectors } from '@obsidians/compiler'

export default connect(['queue', 'network', 'uiState'])(function BottomBar (props) {
  const {
    network,
    queue,
    uiState,

    mnemonic = true,
    secretName = mnemonic ? 'Private Key / Mnemonic' : 'Private Key',
    chains,
  } = props

  const localNetwork = uiState.get('localNetwork')
  let txs
  if (network !== 'dev') {
    txs = queue.getIn([network, 'txs'])
  } else if (localNetwork && localNetwork.lifecycle === 'started') {
    txs = queue.getIn([localNetwork.params.id, 'txs'])
  }

  return <>
    <KeypairButton mnemonic={mnemonic} secretName={secretName} chains={chains}>
      <div className='btn btn-primary btn-sm btn-flat'>
        <i className='fas fa-key' />
      </div>
    </KeypairButton>
    <NetworkStatus network={network} />
    <QueueButton txs={txs} />
    <AbiStorage>
      <div className='btn btn-default btn-sm btn-flat text-muted'>
        <i className='fas fa-list mr-1' />
        ABI Storage
      </div>
    </AbiStorage>
    <div className='flex-1' />
    <CacheRoute
      path={`/${Auth.username || 'local'}/:project`}
      component={CompilerSelectors}
    />
    <CacheRoute
      path={`/${Auth.username || 'local'}/:project`}
      component={TerminalButton}
    />
  </>
})
