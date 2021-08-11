import platform from '@obsidians/platform'

const networks = [
  {
    id: 'ropsten',
    group: 'ethereum',
    name: 'Ropsten',
    fullName: 'Ropsten Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Ropsten Testnet</b>.',
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
    chainId: 4,
    symbol: 'ETH',
  },
  // {
  //   id: 'gorli',
  //   group: 'ethereum',
  //   name: 'Gorli',
  //   fullName: 'Gorli Testnet',
  //   icon: 'fas fa-vial',
  //   notification: 'Switched to <b>Gorli Testnet</b>.',
  //   chainId: 5,
  // },
  {
    id: 'kovan',
    group: 'ethereum',
    name: 'Kovan',
    fullName: 'Kovan Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Kovan Testnet</b>.',
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
    chainId: 1,
    symbol: 'ETH',
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
    symbol: 'ETH',
  }
]