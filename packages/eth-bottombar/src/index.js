import React from 'react'
import CacheRoute from 'react-router-cache-route'

import Auth from '@obsidians/auth'
import { KeypairButton } from '@obsidians/keypair'
import { TerminalButton } from '@obsidians/workspace'

import { QueueButton } from '@obsidians/eth-queue'
import { AbiStorage } from '@obsidians/eth-contract'
import { CompilerSelectors } from '@obsidians/compiler'

export default function BottomBar (props) {
  return <>
    <KeypairButton secretName='Private Key / Mnemonic' chains={props.chains} mnemonic={props.mnemonic}>
      <div className='btn btn-primary btn-sm btn-flat'>
        <i className='fas fa-key' />
      </div>
    </KeypairButton>
    <QueueButton txs={props.txs} />
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
