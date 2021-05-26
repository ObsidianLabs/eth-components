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
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    this.onAccountsChanged(accounts)

    const allAccounts = await this.getAllAccounts()
    this._accounts = allAccounts
    redux.dispatch('UPDATE_UI_STATE', { browserAccounts: allAccounts })
  }

  async onChainChanged (chainId) {
    const intChainId = parseInt(chainId)
    const network = networks.find(n => n.chainId === intChainId)
    if (network) {
      this.networkManager.setNetwork(network, { force: true })
    }
  }

  async getAllAccounts () {
    const result = await this.ethereum.request({ method: 'wallet_getPermissions' })
    const found = result[0].caveats.find(c => c.type === 'filterResponse')
    return found ? found.value : []
  }

  async onAccountsChanged (accounts) {
    redux.dispatch('UPDATE_UI_STATE', { signer: accounts[0] })
  }
}