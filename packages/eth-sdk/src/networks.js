import platform from '@obsidians/platform'

const networks = [
  {
    id: 'ropsten',
    group: 'ethereum',
    name: 'Ropsten',
    fullName: 'Ropsten Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Ropsten Testnet</b>.',
    url: '',
    chainId: 3,
    symbol: 'ETH',
  },
  {
    id: 'rinkeby',
    group: 'ethereum',
    name: 'Rinkeby',
    fullName: 'Rinkeby Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Rinkeby Testnet</b>.',
    url: '',
    chainId: 4,
    symbol: 'ETH',
  },
  {
    id: 'gorli',
    group: 'ethereum',
    name: 'Gorli',
    fullName: 'Gorli Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Gorli Testnet</b>.',
    url: '',
    chainId: 5,
    symbol: 'ETH',
  },
  {
    id: 'kovan',
    group: 'ethereum',
    name: 'Kovan',
    fullName: 'Kovan Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Kovan Testnet</b>.',
    url: '',
    chainId: 42,
    symbol: 'ETH',
  },
  {
    id: 'homestead',
    group: 'ethereum',
    name: 'Mainnet',
    fullName: 'Homestead Mainnet',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Homestead Mainnet</b>.',
    url: '',
    chainId: 1,
    symbol: 'ETH',
  },
  // new chain Avalanche
  {
    id: 'avalanchetest',
    group: 'Avalanche',
    name: 'Testnet',
    fullName: 'Avalanche Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Avalanche Testnet</b>.',
    url: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43113,
    symbol: 'AVAX',
  },
  {
    id: 'avalanchemain',
    group: 'Avalanche',
    name: 'Mainnet',
    fullName: 'Avalanche Mainnet',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Avalanche Mainnet</b>.',
    url: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    symbol: 'AVAX',
  },
  // new chain Polygon
  {
    id: 'polygontest',
    group: 'Polygon',
    name: 'Mumbai',
    fullName: 'Mumbai Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Mumbai-Testnet</b>.',
    url: 'https://matic-testnet-archive-rpc.bwarelabs.com',
    chainId: 80001,
    symbol: 'MATIC',
  },
  {
<<<<<<< HEAD
    id: 'avalanchemain',
    group: 'Avalanche',
    name: 'Avalanche Mainnet',
    fullName: 'Avalanche Mainnet',
=======
    id: 'polygonmain',
    group: 'Polygon',
    name: 'Mainnet',
    fullName: 'Polygon Mainnet',
>>>>>>> e1150fa (add nwe network)
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Avalanche Mainnet</b>.',
    url: 'https://api.avax.network/ext/bc/C/rpc',
    chainId: 43114,
    symbol: 'AVAX',
  },
  // new chain Gnosis
  // seems there is no test net
  // {
  //   id: 'gnosistest',
  //   group: 'xDai',
  //   name: 'Testnet',
  //   fullName: 'Gnosis Testnet',
  //   icon: 'fas fa-globe',
  //   notification: 'Switched to <b>Gnosis-Testnet</b>.',
  //   url: 'https://rpc.testnet.Gnosis.network//',
  //   chainId: 4002,
  //   symbol: 'xDai',
  // },
  {
    id: 'gnosismain',
    group: 'xDai',
    name: 'Mainnet',
    fullName: 'Gnosis Mainnet',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Gnosis Mainnet</b>.',
    url: 'https://rpc.gnosischain.com/',
    chainId: 100,
    symbol: 'xDai',
  },
  // new chain Fantom
  {
    id: 'fantomtest',
    group: 'Fantom',
    name: 'Testnet',
    fullName: 'Fantom Testnet',
<<<<<<< HEAD
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Fantom-Testnet</b>.',
    url: 'https://rpc.testnet.fantom.network//',
    chainId: 4002,
    symbol: 'FTM',
  },
  {
    id: 'fantomtest',
    group: 'Fantom',
    name: 'Fantom Testnet',
    fullName: 'Fantom-Testnet',
=======
>>>>>>> e1150fa (add nwe network)
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Fantom-Testnet</b>.',
    url: 'https://rpc.testnet.fantom.network//',
    chainId: 4002,
    symbol: 'FTM',
  },
  {
    id: 'fantommain',
    group: 'Fantom',
    name: 'Mainnet',
    fullName: 'Fantom Mainnet',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Fantom Mainnet</b>.',
    url: 'https://rpc.ftm.tools/',
    chainId: 250,
    symbol: 'FTM',
  },
  // new chain Harmony
  {
    id: 'harmonytest',
    group: 'Harmony',
    name: 'Testnet',
    fullName: 'Harmony Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Harmony Testnet</b>.',
    url: 'https://api.s0.pops.one/',
    chainId: 1666700000,
    symbol: 'ONE',
  },
  {
    id: 'harmonymain',
    group: 'Harmony',
    name: 'Mainnet',
    fullName: 'Harmony Mainnet',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Harmony Mainnet</b>.',
    url: 'https://api.harmony.one/',
    chainId: 1666600000,
    symbol: 'ONE',
  },
  // new chain Aurora
  {
    id: 'Auroratest',
    group: 'Aurora',
    name: 'Testnet',
    fullName: 'Aurora Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Aurora-Testnet</b>.',
    url: 'https://testnet.aurora.dev/',
    chainId: 1313161555,
    symbol: 'AOA',
  },
  {
    id: 'Auroramain',
    group: 'Aurora',
    name: 'Mainnet',
    fullName: 'Aurora Mainnet',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Aurora Mainnet</b>.',
    url: 'https://mainnet.aurora.dev/',
    chainId: 1313161554,
    symbol: 'AOA',
  },

  
  {
    id: 'espace',
    group: 'Conflux',
    name: 'Testnet',
    fullName: 'Conflux Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Gnosis Testnet</b>.',
    url: 'https://evmtestnet.confluxrpc.com',
    chainId: 71,
    symbol: 'CFX',
  },
  {
    id: 'espace',
    group: 'Conflux',
    name: 'Mainnet',
    fullName: 'Conflux Mainnet',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Gnosis Mainnet</b>.',
    url: 'https://evm.confluxrpc.com',
    chainId: 1030,
    symbol: 'CFX',
  },
]

if (platform.isDesktop) {
  networks.unshift({
    id: 'dev',
    group: 'default',
    name: 'Development',
    fullName: 'Ethereum Instances for Development',
    icon: 'fas fa-laptop-code',
    notification: 'Switched to <b>Development</b> network.',
    url: 'http://localhost:8545',
    chainId: 0,
    symbol: 'ETH',
  })
}

export default networks

export const customNetworks = [
  {
    id: 'custom',
    group: 'others',
    name: 'Custom',
    fullName: 'Custom Network',
    icon: 'fas fa-edit',
    notification: 'Switched to <b>Custom</b> network.',
    url: '',
    symbol: 'ETH',
  }
]