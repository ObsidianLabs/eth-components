import platform from '@obsidians/platform'
import { t } from '@obsidians/i18n'
import NetworkAllLogoImg from './NetworkIcon'

const networks = [
  {
    id: 'homestead',
    group: 'Ethereum',
    name: 'Mainnet',
    fullName: 'Ethereum Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Ethereum Mainnet</b>.`,
    url: 'https://main-rpc.linkpool.io',
    explorerUrl: 'https://etherscan.io',
    chainId: 1,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.ethereummain,
  },
  {
    id: 'ropsten',
    group: 'Ethereum',
    name: 'Ropsten',
    fullName: 'Ropsten Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Ropsten Testnet</b>.`,
    url: 'https://ropsten.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://ropsten.etherscan.io',
    chainId: 3,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.ethereummain,
  },
  {
    id: 'rinkeby',
    group: 'Ethereum',
    name: 'Rinkeby',
    fullName: 'Rinkeby Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Rinkeby Testnet</b>.`,
    url: 'https://rinkeby.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://rinkeby.etherscan.io',
    chainId: 4,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.ethereummain,
  },
  {
    id: 'goerli',
    group: 'Ethereum',
    name: 'Goerli',
    fullName: 'Goerli Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Goerli Testnet</b>.`,
    url: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://goerli.etherscan.io',
    chainId: 5,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.ethereummain,
  },
  {
    id: 'kovan',
    group: 'Ethereum',
    name: 'Kovan',
    fullName: 'Kovan Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Kovan Testnet</b>.`,
    url: 'https://kovan.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://kovan.etherscan.io',
    chainId: 42,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.ethereummain,
  },
  {
    id: 'bnbmain',
    group: 'BNB chain',
    name: 'Mainnet',
    fullName: 'BNB Chain Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>BNB Chain</b>.`,
    url: 'https://bsc-dataseed.binance.org/',
    explorerUrl: 'https://bscscan.com',
    chainId: 56,
    symbol: 'BNB',
    logoIcon: NetworkAllLogoImg.bnbmain,
  },
  {
    id: 'bnbtest',
    group: 'BNB chain',
    name: 'Testnet',
    fullName: 'BNB Chain Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>BNB Chain Testnet</b>.`,
    url: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    explorerUrl: 'https://testnet.bscscan.com',
    chainId: 97,
    symbol: 'BNB',
    logoIcon: NetworkAllLogoImg.bnbmain,
  },
  {
    id: 'avalanchemain',
    group: 'Avalanche C-Chain',
    name: 'Mainnet',
    fullName: 'Avalanche C-Chain Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Avalanche C-Chain Mainnet</b>.`,
    url: 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    chainId: 43114,
    symbol: 'AVAX',
    logoIcon: NetworkAllLogoImg.avalanchemain,
  },
  {
    id: 'avalanchetest',
    group: 'Avalanche C-Chain',
    name: 'Testnet',
    fullName: 'Avalanche C-Chain Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Avalanche C-Chain Testnet</b>.`,
    url: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    chainId: 43113,
    symbol: 'AVAX',
    logoIcon: NetworkAllLogoImg.avalanchemain,
  },
  {
    id: 'polygonmain',
    group: 'Polygon',
    name: 'Mainnet',
    fullName: 'Polygon Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Polygon Mainnet</b>.`,
    url: 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    chainId: 137,
    symbol: 'MATIC',
    logoIcon: NetworkAllLogoImg.polygonmain,
  },
  {
    id: 'polygontest',
    group: 'Polygon',
    name: 'Testnet',
    fullName: 'Polygon Testnet (Mumbai)',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Polygon Testnet (Mumbai)</b>.`,
    url: 'https://matic-mumbai.chainstacklabs.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    chainId: 80001,
    symbol: 'MATIC',
    logoIcon: NetworkAllLogoImg.polygonmain,
  },
  {
    id: 'fantommain',
    group: 'Fantom',
    name: 'Mainnet',
    fullName: 'Fantom Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Fantom Mainnet</b>.`,
    url: 'https://rpc.ftm.tools/',
    explorerUrl: 'https://ftmscan.com',
    chainId: 250,
    symbol: 'FTM',
    logoIcon: NetworkAllLogoImg.fantommain,
  },
  {
    id: 'fantomtest',
    group: 'Fantom',
    name: 'Testnet',
    fullName: 'Fantom Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Fantom Testnet</b>.`,
    url: 'https://rpc.testnet.fantom.network/',
    explorerUrl: 'https://testnet.ftmscan.com',
    chainId: 4002,
    symbol: 'FTM',
    logoIcon: NetworkAllLogoImg.fantommain,
  },
  {
    id: 'harmonymain',
    group: 'Harmony',
    name: 'Mainnet',
    fullName: 'Harmony Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Harmony Mainnet</b>.`,
    url: 'https://api.harmony.one/',
    explorerUrl: 'https://explorer.harmony.one',
    chainId: 1666600000,
    symbol: 'ONE',
    logoIcon: NetworkAllLogoImg.harmonymain,
  },
  {
    id: 'harmonytest',
    group: 'Harmony',
    name: 'Testnet',
    fullName: 'Harmony Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Harmony Testnet</b>.`,
    url: 'https://api.s0.pops.one/',
    explorerUrl: 'https://explorer.pops.one',
    chainId: 1666700000,
    symbol: 'ONE',
    logoIcon: NetworkAllLogoImg.harmonymain,
  },
  {
    id: 'confluxmain',
    group: 'Conflux Espace',
    name: 'Mainnet',
    fullName: 'Conflux eSpace Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Conflux eSpace Mainnet</b>.`,
    url: 'https://evm.confluxrpc.com',
    explorerUrl: 'https://evm.confluxscan.io',
    chainId: 1030,
    symbol: 'CFX',
    logoIcon: NetworkAllLogoImg.confluxmain,
  },
  {
    id: 'confluxtest',
    group: 'Conflux Espace',
    name: 'Testnet',
    fullName: 'Conflux eSpace Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Conflux eSpace Testnet</b>.`,
    url: 'https://evmtestnet.confluxrpc.com',
    explorerUrl: 'https://evmtestnet.confluxscan.io',
    chainId: 71,
    symbol: 'CFX',
    logoIcon: NetworkAllLogoImg.confluxmain,
  },
  {
    id: 'gnosismain',
    group: 'Gnosis (xDai)',
    name: 'Mainnet',
    fullName: 'xDAI Chain Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>xDAI Chain</b>.`,
    url: 'https://rpc.gnosischain.com/',
    explorerUrl: 'https://blockscout.com/xdai/mainnet',
    chainId: 100,
    symbol: 'xDai',
    logoIcon: NetworkAllLogoImg.gnosismain,
  },
  {
    id: 'auroramain',
    group: 'Aurora (near)',
    name: 'Mainnet',
    fullName: 'Aurora Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Aurora Mainnet</b>.`,
    url: 'https://mainnet.aurora.dev/',
    explorerUrl: 'https://explorer.mainnet.aurora.dev',
    chainId: 1313161554,
    symbol: 'AOA',
    logoIcon: NetworkAllLogoImg.auroramain,
  },
  {
    id: 'auroratest',
    group: 'Aurora (near)',
    name: 'Testnet',
    fullName: 'Aurora Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Aurora Testnet</b>.`,
    url: 'https://testnet.aurora.dev/',
    explorerUrl: 'https://explorer.testnet.aurora.dev',
    chainId: 1313161555,
    symbol: 'AOA',
    logoIcon: NetworkAllLogoImg.auroramain,
  },
  {
    id: 'evmosmain',
    group: 'Evmos',
    name: 'Mainnet',
    fullName: 'Evmos Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Evmos Mainnet</b>.`,
    url: 'https://eth.bd.evmos.org:8545',
    explorerUrl: 'https://evm.evmos.org',
    chainId: 9001,
    symbol: 'EVMOS',
    logoIcon: NetworkAllLogoImg.evmosmain,
  },
  {
    id: 'evmostest',
    group: 'Evmos',
    name: 'Testnet',
    fullName: 'Evmos Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Evmos Testnet</b>.`,
    url: 'https://eth.bd.evmos.dev:8545',
    explorerUrl: 'https://evm.evmos.dev',
    chainId: 9000,
    symbol: 'EVMOS',
    logoIcon: NetworkAllLogoImg.evmosmain,
  },
  {
    id: 'arbitrummain',
    group: 'Arbitrum',
    name: 'Mainnet',
    fullName: 'Arbitrum Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Arbitrum Mainnet</b>.`,
    url: 'https://rpc.ankr.com/arbitrum',
    explorerUrl: 'https://arbiscan.io',
    chainId: 42161,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.arbitrummain,
  },
  {
    id: 'arbitrumtest',
    group: 'Arbitrum',
    name: 'Testnet',
    fullName: 'Arbitrum Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Arbitrum Testnet</b>.`,
    url: 'https://rinkeby.arbitrum.io/rpc',
    explorerUrl: 'https://testnet.arbiscan.io',
    chainId: 421611,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.arbitrummain,
  },
  {
    id: 'optimismmain',
    group: 'Optimism',
    name: 'Mainnet',
    fullName: 'Optimism Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Optimism Mainnet</b>.`,
    url: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    chainId: 10,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.optimismmain,
  },
  {
    id: 'optimismtest',
    group: 'Optimism',
    name: 'Testnet',
    fullName: 'Optimism Kovan Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Optimism Kovan Testnet</b>.`,
    url: 'https://kovan.optimism.io/',
    explorerUrl: 'https://kovan-optimistic.etherscan.io',
    chainId: 69,
    symbol: 'ETH',
    logoIcon: NetworkAllLogoImg.optimismmain,
  },
  {
    id: 'moonrivermain',
    group: 'Moonriver',
    name: 'Mainnet',
    fullName: 'Moonriver Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Moonriver Mainnet</b>.`,
    url: 'https://rpc.api.moonriver.moonbeam.network',
    explorerUrl: 'https://moonriver.moonscan.io',
    chainId: 1285,
    symbol: 'MOVR',
    logoIcon: NetworkAllLogoImg.moonrivermain,
  },
  {
    id: 'moonrivertest',
    group: 'Moonriver',
    name: 'Testnet',
    fullName: 'Moonriver Alpha Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Moonriver Alpha Testnet</b>.`,
    url: 'https://rpc.api.moonbase.moonbeam.network',
    explorerUrl: 'https://moonbase.moonscan.io',
    chainId: 1287,
    symbol: 'DEV',
    logoIcon: NetworkAllLogoImg.moonrivermain,
  },
  {
    id: 'moonbeammain',
    group: 'Moonbeam',
    name: 'Mainnet',
    fullName: 'Moonbeam Mainnet',
    icon: 'fas fa-globe',
    notification: `${t('network.network.switchedTo')} <b>Moonbeam Mainnet</b>.`,
    url: 'https://rpc.api.moonbeam.network',
    explorerUrl: 'https://moonbeam.moonscan.io',
    chainId: 1284,
    symbol: 'GLMR',
    logoIcon: NetworkAllLogoImg.moonbeammain,
  },
  {
    id: 'moonbeamtest',
    group: 'Moonbeam',
    name: 'Testnet',
    fullName: 'Moonbeam Alpha Testnet',
    icon: 'fas fa-vial',
    notification: `${t('network.network.switchedTo')} <b>Moonbeam Alpha Testnet</b>.`,
    url: 'https://rpc.testnet.moonbeam.network',
    explorerUrl: 'https://moonbase.moonscan.io',
    chainId: 1287,
    symbol: 'DEV',
    logoIcon: NetworkAllLogoImg.moonbeammain,
  }
]

if (platform.isDesktop) {
  networks.unshift({
    id: 'dev',
    group: 'default',
    name: 'Development',
    fullName: 'Development',
    icon: 'fas fa-laptop-code',
    notification: `${t('network.network.switchedTo')} <b>Ethereum Instances for Development</b> ${t('network.network.networkLow')}.`,
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
    notification: `${t('network.network.switchedTo')} <b>Custom</b> ${t('network.network.networkLow')}.`,
    url: '',
    symbol: 'ETH',
  }
]