import redux from '@obsidians/redux'
import networks from './networks'

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

  handleChainChanged() {
    const state = redux.getState()
    const intChainId = parseInt(chainId)
    const network = networks.find(n => n.chainId === intChainId)
    const currentNetwork = networks.find(n => n.id === state.network)

    if (!currentNetwork || currentNetwork.chainId !== intChainId) {
      if (network) {
        this.networkManager.setNetwork(network, { force: true })
      }
      else {
        const chainList = state.chainList.toJS().networks
        const customChain = chainList.find(chain => chain.chainId === intChainId)
        if (customChain) {
          const rpc = customChain.rpc.find(rpc => rpc.indexOf("${INFURA_API_KEY}") === -1)
          if (rpc) {
            const option = {
              url: rpc,
              chainId: intChainId,
              name: customChain.name,
            }
            const customConfig = { url: rpc, option: JSON.stringify(option) }
            const currentCustomChain = state.customNetworks.toJS()
            let activeCustomNetworkChainId = null
            Object.values(currentCustomChain).forEach(network => {
              if (network && network.active) activeCustomNetworkChainId = network.chainId
            })
            if (activeCustomNetworkChainId !== intChainId) {
              redux.dispatch('MODIFY_CUSTOM_NETWORK', {
                name: customChain.name,
                option,
              })
              redux.dispatch('ACTIVE_CUSTOM_NETWORK', option)
              redux.dispatch('UPDATE_UI_STATE', { customNetworkOption: option })
              redux.dispatch('CHANGE_NETWORK_STATUS', true)
              this.networkManager.updateCustomNetwork({ ...customConfig, notify: false })
            }
          }
        }
      }
    }
  }

  async initialize(ethereum) {

    ethereum.on('chainChanged', this.onChainChanged.bind(this))
    const chainId = await ethereum.request({ method: 'eth_chainId' })
    this.onChainChanged(chainId)

    ethereum.on('accountsChanged', this.onAccountsChanged.bind(this))
    const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
    this.onAccountsChanged(accounts)

    const allAccounts = await this.getAllAccounts()
    this._accounts = allAccounts
    redux.dispatch('UPDATE_UI_STATE', { browserAccounts: allAccounts })
    redux.dispatch('CHANGE_NETWORK_STATUS', true)

    const partialList = await this.networkManager.fethcPartialList()
    redux.dispatch('SET_CHAIN_LIST', partialList)
  }

  async onChainChanged(chainId) {
    // disable callback function after changing network. reason: procedure already done in setNetwork
    // this.handleChainChanged(chainId)
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