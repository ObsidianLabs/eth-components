import React, { PureComponent } from 'react'

import { ToolbarButton } from '@obsidians/ui-components'

import fileOps from '@obsidians/file-ops'

const faucetUrlList = [
  {
    name: 'ropsten',
    url: `https://testnet.help/en/ethfaucet/ropsten`,
  },
  {
    name: 'rinkeby',
    url: `https://rinkebyfaucet.io/`,
  },
  {
    name: 'goerli',
    url: `https://goerlifaucet.com/`,
  },
  {
    name: 'kovan',
    url: `https://faucets.chain.link/`,
  },
  {
    name: 'bnbtest',
    url: `https://testnet.binance.org/faucet-smart`,
  },
  {
    name: 'avalanchetest',
    url: `https://faucet.avax-test.network/`,
  },
  {
    name: 'polygontest',
    url: `https://faucet.polygon.technology/`,
  },
  {
    name: 'fantomtest',
    url: `https://faucet.fantom.network/`,
  },
  {
    name: 'harmonytest',
    url: `https://faucet.pops.one/`,
  },
  {
    name: 'confluxtest',
    url: `https://efaucet.confluxnetwork.org/`,
  },
  {
    name: 'auroratest',
    url: `https://aurora.dev/faucet`,
  },
  {
    name: 'evmostest',
    url: `https://faucet.evmos.dev/`,
  },
  {
    name: 'moonrivertest',
    url: `https://apps.moonbeam.network/moonbase-alpha/faucet/`,
  },
  {
    name: 'moonbeamtest',
    url: `https://apps.moonbeam.network/moonbase-alpha/faucet/`,
  }
]

export default class FaucetButton extends PureComponent {
  claim = async () => {
    fileOps.current.openLink(faucetUrlList.find(item => item.name === this.props.network)?.url)
  }

  render () {
    if (!faucetUrlList.find(item => item.name === this.props.network)) {
      return null
    }
    return (
      <ToolbarButton
        id='navbar-faucet'
        size='md'
        icon='fas fa-faucet'
        tooltip='Faucet'
        onClick={this.claim}
      />
    )
  }
}
