import redux from '@obsidians/redux'

export default class BrowserExtension {
  static Init(networkManager) {
    if (window.ethereum) {
      return new BrowserExtension(networkManager, window.ethereum)
    }
  }

  static findMetaMaskProvider(ethereum) {
    let currentProvdier = ethereum
    if (ethereum.providers?.length) {
      ethereum.providers.forEach(async (provider) => {
        currentProvdier = provider.isMetaMask ? provider : currentProvdier
      })
    }
    return currentProvdier
  }

  constructor(networkManager, ethereum) {
    this.name = 'MetaMask'
    this.networkManager = networkManager
    this._accounts = []
    this._enabled = false
    if (ethereum) {
      this._enabled = true
      this.ethereum = BrowserExtension.findMetaMaskProvider(ethereum)
      this.initialize(this.ethereum)
    }
  }

  get isEnabled() {
    return this._enabled
  }

  get currentAccount() {
    return this.ethereum.selectedAddress
  }

  get allAccounts() {
    return this._accounts
  }

  async onChainChanged(chainId) {
    const newChainId = parseInt(chainId)
    const matchedNet = this.networkManager.findChainById(redux.getState().network)
    if (matchedNet && matchedNet.chainId === newChainId) return
    const includeNet = this.networkManager.findChainByChainId(newChainId)
    if (includeNet) {
      this.networkManager.setNetwork(includeNet)
    } else { // add a new chain if we could not find newChainId in our network list
      const newChain = this.networkManager.searchChain(chainId, true)
      const validRPrc = !!newChain && newChain.rpc.length !== 0
      if (!validRPrc) return

      const name = newChain.name.replace(/\s+/g, "").toLowerCase()
      const option = {
        url: newChain.rpc[0],
        chainId: newChainId,
        name: name,
        id: name
      }
      await redux.dispatch('ADD_CUSTOM_NETWORK', option)
      
      const newNetList = this.networkManager.getNewNetList()
      this.networkManager.addNetworks(newNetList)
      this.networkManager.setNetwork(option)
    }
  }
  
  async initialize(ethereum) {
    ethereum.on('chainChanged', this.onChainChanged.bind(this))
 
    ethereum.on('accountsChanged', this.onAccountsChanged.bind(this))
    const accounts = await this.getAccounts()
    this.onAccountsChanged(accounts)

    const allAccounts = await this.getAllAccounts()
    this._accounts = allAccounts
    redux.dispatch('UPDATE_UI_STATE', { browserAccounts: allAccounts })
    redux.dispatch('CHANGE_NETWORK_STATUS', true)

  }

  async getEthChaind() {
    try {
      const hexChainId = await this.ethereum.request({ method: 'eth_chainId' })
      return parseInt(hexChainId)
    } catch (error) {
      console.warn('getEthChaind failed', error)
      throw new Error(error)
    }
  }

  async getAccounts() {
    try {
      return this.ethereum.request({ method: 'eth_requestAccounts' })
    } catch (error) {
      console.warn('getAccounts failed', error)
      throw new Error(error)
    }
  }

  async getAllAccounts() {
    const result = await this.ethereum.request({ method: 'wallet_getPermissions' })
    const found = result[0].caveats.find(c => c.type === 'filterResponse')
    return found ? found.value : []
  }

  async onAccountsChanged(accounts) {
    redux.dispatch('UPDATE_UI_STATE', { signer: accounts[0] })
  }
}