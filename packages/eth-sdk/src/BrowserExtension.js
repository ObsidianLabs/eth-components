import networks from './networks'

export default class BrowserExtension {
  constructor (networkManager, ethereum) {
    this.networkManager = networkManager
    this.ethereum = ethereum
    this.initialize(ethereum)
  }
  
  async initialize (ethereum) {
    ethereum.on('chainChanged', this.onChainChanged.bind(this))
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    this.onChainChanged(chainId)

    ethereum.on('accountsChanged', this.onAccountsChanged.bind(this))
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    this.onAccountsChanged(accounts)
  }

  async onChainChanged (chainId) {
    const numberChainId = parseInt(chainId)
    const network = networks.find(n => n.chainId === numberChainId)
    if (network) {
      this.networkManager.setNetwork(network, true)
    }
  }

  async onAccountsChanged (accounts) {
    console.log(accounts)
  }
}