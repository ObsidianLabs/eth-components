import platform from '@obsidians/platform'
import headerActions from '@obsidians/eth-header'
import notification from '@obsidians/notification'
import redux from '@obsidians/redux'
import { t } from '@obsidians/i18n'
import { utils } from '@obsidians/sdk'
import { getCachingKeys, dropByCacheKey } from 'react-router-cache-route'
import extraRpcList from './constants/extraRpcs.json'

class NetworkManager {
  constructor() {
    this.networks = []
    this._sdk = null
    this.network = undefined
    this.Sdks = new Map()
  }

  addSdk(Sdk, networks) {
    networks.forEach(n => this.Sdks.set(n.id, Sdk))
    this.networks = [...this.networks, ...networks]

    const enabled = !process.env.REACT_APP_DISABLE_BROWSER_EXTENSION
    if (platform.isWeb && enabled && Sdk.InitBrowserExtension) {
      this.browserExtension = Sdk.InitBrowserExtension(this)
    }
  }

  get networkId() {
    return this.network?.id
  }

  get Sdk() {
    return this.Sdks.get(this.networkId)
  }

  get sdk() {
    return this._sdk
  }

  get current() {
    return this.networks.find(n => n.id === this.networkId)
  }

  get symbol() {
    return this.current?.symbol
  }

  get metaMaskConnected() {
    if (!this?.browserExtension || !this?.browserExtension?.ethereum?.isConnected) return false
    return this.browserExtension.ethereum.isConnected()
  }

  get customNetWorks() {
    return redux.getState().customNetworks.toJS()
  }

  addNetworks(networks) {
    networks.forEach(n => this.Sdks.set(n.id, this.Sdk || this.Sdks.get('custom')))
    this.networks = networks
  }

  deleteNetwork(networkId) {
    const index = this.networks.findIndex(n => n.id === networkId)
    if (index === -1) {
      return
    }
    this.networks.splice(index, 1)
    this.Sdks.delete(networkId)
  }

  newSdk(params) {
    const networkId = params.id.split('.')[0]
    const Sdk = this.Sdks.get(networkId)
    if (!Sdk) {
      return null
    }
    return new Sdk(params)
  }

  async updateSdk(params) {
    this._sdk = this.newSdk({ ...this.network, ...params })
    await new Promise(resolve => {
      const h = setInterval(() => {
        if (!this.sdk) {
          clearInterval(h)
          return
        }
        this.sdk.getStatus().then(() => {
          clearInterval(h)
          resolve()
        }).catch(() => null)
      }, 1000)
    })
  }

  async disposeSdk() {
    this._sdk && this._sdk.dispose()
    if (this.networkId === 'dev') {
      this._sdk = null
    }
    if (this.onSdkDisposedCallback) {
      this.onSdkDisposedCallback()
    }
  }

  onSdkDisposed(callback) {
    this.onSdkDisposedCallback = callback
  }

  hasDuplicatedNetwork(rpcUrl) {
    return !this.networks.every(net => net.url !== rpcUrl)
  }

  async requestMetaMaskRPC(networkInfo) {
    const metaMaskClient = this.browserExtension.ethereum
    /** it might be useful if we need to check the currentChainId  */
    // const currentChainId = this.browserExtension.getChainId
    //   ? await this.browserExtension.getChainId()
    //   : await metaMaskClient.request({ method: 'eth_chainId' })
    // if (currentChainId === networkInfo.chainId) return
    if (!networkInfo.chainId) {
      notification.error(t('network.custom.err'), t('network.custom.lackChainId'))
      return 
    }
    const hexChainId = utils.format.hexValue(+networkInfo.chainId)
    const switchChain = (chainId) => {
        return metaMaskClient.request({
          method: 'wallet_switchEthereumChain',
          params: [{
            chainId,
          }]
        })
      }
      
    const addChain = ({ chainId, chainName, rpcUrls }) => {
        return metaMaskClient.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId,
            chainName,
            rpcUrls,
          }],
        })
    }

    try {
      await switchChain(hexChainId)
    } catch (e) {
      if ([4902, -32603].includes(e.code)) {
        try {
          await addChain({
            chainId: hexChainId,
            chainName: networkInfo.fullName,
            rpcUrls: [networkInfo.url],
          })
          await switchChain(hexChainId)
        } catch {
          return notification.error(t('network.network.error'), t('network.network.errorText'))
        }
      }
    }
  } 

  async reconnectNetwork() {
    this.setNetwork(this.network)
  }

  async setNetwork(network, { force, redirect = true, notify = true } = {}) {
    redux.dispatch('ACTIVE_CUSTOM_NETWORK', network)
    this.metaMaskConnected && this.requestMetaMaskRPC(network)
    if (!network) return
    if (process.env.DEPLOY === 'bsn' && network.projectKey) {
      notification.warning(`${network.name}`, `The current network ${network.name} enables a project key, please turn it off in the BSN portal.`, 5)
    }
    const cachingKeys = getCachingKeys()
    cachingKeys.filter(key => key.startsWith('contract-') || key.startsWith('account-')).forEach(dropByCacheKey)

    this.network = network
    if (network.id && network.id !== 'dev') {
      try {
        this._sdk = this.newSdk(network)
        this._sdk.updateEIP1559Support()
      } catch (error) {
        this._sdk && this._sdk.dispose()
        this._sdk = null
      }
    } else {
      this._sdk && this._sdk.dispose()
      this._sdk = null
    }

    redux.dispatch('SELECT_NETWORK', network.id)

    if (notify) {
      redux.dispatch('CHANGE_NETWORK_STATUS', true)
    }
    if (redirect) {
      headerActions.updateNetwork(network.id)
    }
  }

  async updateCustomNetwork({ url, option = '{}', notify = true, name, chainId ='' }) {
    try {
      if (option) {
        option = JSON.parse(option)
      }
    } catch {
      notification.error('Invalid Option', '')
      return
    }
    const info = await this.createSdk({ id: 'custom', url, option })

    if (info && notify) {
      redux.dispatch('SELECT_NETWORK', `custom`)
      redux.dispatch('CHANGE_NETWORK_STATUS', true)
      notification.success(t('network.network.connected'), `${t('network.network.connectedTo')} <b>${name || url}</b>`)
    }

    return info
  }

  async createSdk(params) {
    const sdk = this.newSdk(params)
    try {
      const info = await sdk.networkInfo()
      if (params.id !== 'custom') this._sdk = sdk
      return info
    } catch (e) {
      console.warn(e)
      notification.error('Invalid Node URL', '')
    }
  }

  getNewNetList () {
    const customNetworkGroup = Object.keys(this.customNetWorks).map(name => ({
      group: 'others',
      icon: 'fas fa-vial',
      id: name,
      networkId: this.customNetWorks[name]?.networkId || name,
      name: name,
      fullName: name,
      notification: `${t('network.network.switchedTo')} <b>${name}</b>.`,
      url: this.customNetWorks[name].url,
      chainId: this.customNetWorks[name]?.chainId || ''
    })).sort((a, b) => a.name.localeCompare(b.name))
    
    return this.networks.filter(item => item.group !== 'others' || item.id === 'others').concat([{
      fullName: 'Custom Network',
      group: 'others',
      icon: 'fas fa-edit',
      id: 'custom',
      name: 'Custom',
      notification: `${t('network.network.switchedTo')} <b>Custom</b> ${t('network.network.networkLow')}.`,
      symbol: 'ETH',
      url: '',
    }]).concat(customNetworkGroup)
  }


  fethcPartialList() {
    return fetch('https://chainid.network/chains.json')
      .then((response) => response.json())
      .catch((error) => {
        console.warn('fetch chains.json failed')
        throw new Error(error)
      })
  }

  removeEndingSlash(rpc) {
    return rpc.endsWith("/") ? rpc.substr(0, rpc.length - 1) : rpc
  }

  searchChainList(value, isChainId = false) {
    const netList = redux.getState().chainList.toJS().networks
    if (isChainId) return netList.find(net => +net.chainId === +value)
    let checkResult = undefined
    netList.forEach(e => {
      if (e.rpc) {
        const matched = e.rpc.find(item => item === value)
        checkResult = matched ? e : checkResult
      }
    })
    return checkResult
  }

  searchExtraRpcList(value, isChainId) {
    const keysArr = Object.keys(extraRpcList)
    if (isChainId) return keysArr.find(net => +net === +value)
    let checkResult = undefined
    keysArr.forEach(e => {
      if (extraRpcList[e].rpcs) {
        const matched = extraRpcList[e].rpcs.find(item => item === value)
        checkResult = matched ? e : checkResult
      }
    })
    return checkResult
  }

  populateChain(value, findFromChainList = false) {
    const filterArr = (arr) => arr.map(this.removeEndingSlash).filter((rpc) => !rpc.includes("${INFURA_API_KEY}"))
    if (findFromChainList) {
      const extraRpcKey = this.searchExtraRpcList(+value.chainId, true)
      const newArr = [...value.rpc, ...extraRpcList[extraRpcKey].rpcs]
      value.rpc = Array.from(new Set(filterArr(newArr)))
      return value
    } else {
      const chain = this.searchChainList(value, true)
      const newArr = [...chain.rpc, ...extraRpcList[+value].rpcs]
      chain.rpc = Array.from(new Set(filterArr(newArr)))
      return chain
    }
  }

  searchChain(searchValue, isChainId = false) {
    const firstCheckRes = this.searchChainList(searchValue, isChainId)
    if (firstCheckRes) return this.populateChain(firstCheckRes, true)
    const secondCheckRes = this.searchExtraRpcList(searchValue, isChainId)
    if (secondCheckRes) return this.populateChain(secondCheckRes, false)
    return false
  }

  findChainById(value) {
    return this.networks.find(net => net.id === value || net.name === value)
  }

  findChainByChainId(value) {
    return this.networks.find(net => net.chainId === value)
  }
}

export default new NetworkManager()