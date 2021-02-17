import redux from '@obsidians/redux'
import networks from './networks'

export default class BrowserExtension {
  constructor (networkManager, ethereum) {
    this.name = 'MetaMask'
    this.networkManager = networkManager
    this._accounts = []
    this._enabled = false
    if (ethereum && ethereum.isMetaMask) {
      this._enabled = true
      this.ethereum = ethereum
      this.initialize(ethereum)
    }
  }

  get isEnabled () {
    return this._enabled
  }

  get currentAccount () {
    return this.ethereum.selectedAddress
  }

  get allAccounts () {
    return this._accounts
  }
  
  async initialize (ethereum) {
    ethereum.on('chainChanged', this.onChainChanged.bind(this))
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    this.onChainChanged(chainId)

    ethereum.on('accountsChanged', this.onAccountsChanged.bind(this))
    const accounts = await this.getAllAccounts()
    this._accounts = accounts
    redux.dispatch('UPDATE_UI_STATE', { browserAccounts: accounts })
    this.onAccountsChanged(accounts)
  }

  async onChainChanged (chainId) {
    const numberChainId = parseInt(chainId)
    const network = networks.find(n => n.chainId === numberChainId)
    if (network) {
      this.networkManager.setNetwork(network, true)
    }
  }

  async getAllAccounts () {
    const result = await ethereum.request({ method: 'wallet_getPermissions' })
    const found = result[0].caveats.find(c => c.type === 'filterResponse')
    return found ? found.value : []
  }

  async onAccountsChanged (accounts) {
    console.log(accounts)
  }
}