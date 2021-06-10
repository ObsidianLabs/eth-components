import React from 'react'
import CacheRoute from 'react-router-cache-route'

import Auth from '@obsidians/auth'
import { KeypairButton } from '@obsidians/keypair'
import { TerminalButton } from '@obsidians/workspace'

import { QueueButton } from '@obsidians/eth-queue'
import { AbiStorage } from '@obsidians/eth-contract'
import { CompilerSelectors } from '@obsidians/compiler'

export default function BottomBar (props) {
  const {
    mnemonic,
    secretName = mnemonic ? 'Private Key / Mnemonic' : 'Private Key',
    chains,
    txs,
  } = props
  return <>
    <KeypairButton mnemonic={mnemonic} secretName={secretName} chains={chains}>
      <div className='btn btn-primary btn-sm btn-flat'>
        <i className='fas fa-key' />
      </div>
    </KeypairButton>
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
}
