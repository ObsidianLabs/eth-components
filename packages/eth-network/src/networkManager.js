import platform from '@obsidians/platform'
import headerActions from '@obsidians/eth-header'
import notification from '@obsidians/notification'
import redux from '@obsidians/redux'
import { t } from '@obsidians/i18n'

import { getCachingKeys, dropByCacheKey } from 'react-router-cache-route'

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

  addNetworks(networks) {
    networks.forEach(n => this.Sdks.set(n.id, this.Sdks.get(n.id)))
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

  async reconnectNetwork() {
    this.setNetwork(this.network)
  }

  async setNetwork(network, { force, redirect = true, notify = true } = {}) {

    redux.dispatch('ACTIVE_CUSTOM_NETWORK', network)

    if (this.browserExtension && this.browserExtension?.ethereum && this.browserExtension.ethereum.isConnected() && network.chainId) {
      const chainId = this.browserExtension.getChainId ? await this.browserExtension.getChainId()
        : await this.browserExtension.ethereum.request({ method: 'eth_chainId' })
      
        const switchChain = this.browserExtension?.switchChain?.bind(this.browserExtension) || (chainId => {
        return this.browserExtension.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{
            chainId,
          }]
        })
      })
      
      const addChain = this.browserExtension?.addChain?.bind(this.browserExtension) || (({ chainId, chainName, rpcUrls }) => {
        return this.browserExtension.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId,
            chainName,
            rpcUrls,
          }],
        })
      })
      
      const hexChainId = `0x${network.chainId.toString(16)}`
      
      if (chainId !== hexChainId) {
        try {
          await switchChain(hexChainId)
        } catch (e) {
          if (e.code === 4902) {
            await addChain({
              chainId: hexChainId,
              chainName: network.fullName,
              rpcUrls: [network.url],
            })
            await switchChain(hexChainId)
          }
        }
      }
    }

    if (!network || network.id === redux.getState().network) {
      return
    }

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
      network.notification && notification.success(t('network.network.network'), network.notification)
      redux.dispatch('CHANGE_NETWORK_STATUS', true)
    }
    if (redirect) {
      headerActions.updateNetwork(network.id)
    }
  }

  async updateCustomNetwork({ url, option = '{}', notify = true, name }) {
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
}

export default new NetworkManager()