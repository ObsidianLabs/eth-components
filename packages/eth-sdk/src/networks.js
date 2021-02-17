import platform from '@obsidians/platform'

const networks = [
  {
    id: 'ropsten',
    group: 'testnet',
    name: 'Ropsten',
    fullName: 'Ropsten Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Ropsten Testnet</b>.',
    url: '/',
    chainId: 3,
  },
  {
    id: 'rinkeby',
    group: 'testnet',
    name: 'Rinkeby',
    fullName: 'Rinkeby Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Rinkeby Testnet</b>.',
    url: '/',
    chainId: 4,
  },
  // {
  //   id: 'gorli',
  //   group: 'testnet',
  //   name: 'Gorli',
  //   fullName: 'Gorli Testnet',
  //   icon: 'fas fa-vial',
  //   notification: 'Switched to <b>Gorli Testnet</b>.',
  //   url: '/',
  //   chainId: 5,
  // },
  {
    id: 'kovan',
    group: 'testnet',
    name: 'Kovan',
    fullName: 'Kovan Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>Kovan Testnet</b>.',
    url: '/',
    chainId: 42,
  },
  {
    id: 'homestead',
    group: 'mainnet',
    name: 'Homestead',
    fullName: 'Homestead Mainnet',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>Homestead Mainnet</b>.',
    url: '/',
    chainId: 1,
  }
]

if (platform.isDesktop) {
  networks.unshift({
    id: 'dev',
    group: 'default',
    name: 'Development',
    fullName: 'Development Network',
    icon: 'fas fa-laptop-code',
    notification: 'Switched to <b>Development</b> network.',
    url: 'http://localhost:8545',
    chainId: 0,
  })
}

export default networks