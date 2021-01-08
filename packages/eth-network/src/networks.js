import platform from '@obsidians/platform'
import { List } from 'immutable'

const networkList = [
  {
    id: 'testnet',
    group: 'testnet',
    name: 'Testnet',
    fullName: 'PlatON Testnet',
    icon: 'fas fa-vial',
    notification: 'Switched to <b>PlatON Testnet</b> network.',
    url: 'https://test.confluxrpc.org',
    chainId: 1,
    explorer: 'https://testnet.confluxscan.io/v1',
  },
  {
    id: 'tethys',
    group: 'mainnet',
    name: 'Tethys',
    fullName: 'PlatON Tethys',
    icon: 'fas fa-globe',
    notification: 'Switched to <b>PlatON Tethys</b> network.',
    url: 'https://main.confluxrpc.org',
    chainId: 1029,
    explorer: 'https://confluxscan.io/v1',
  }
]
if (platform.isDesktop) {
  networkList.unshift({
    id: 'dev',
    group: 'default',
    name: 'Development',
    fullName: 'Development Network',
    icon: 'fas fa-laptop-code',
    notification: 'Switched to <b>Development</b> network.',
    chainId: 0,
  })
}
export default List(networkList)
