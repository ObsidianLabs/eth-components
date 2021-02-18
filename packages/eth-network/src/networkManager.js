import platform from '@obsidians/platform'
import headerActions from '@obsidians/header'
import notification from '@obsidians/notification'
import redux from '@obsidians/redux'
import Sdk from '@obsidians/sdk'

import { getCachingKeys, dropByCacheKey } from 'react-router-cache-route'

class NetworkManager {
  constructor () {
    this._sdk = null
    this.network = undefined

    if (platform.isWeb && Sdk.InitBrowserExtension) {
      this.browserExtension = Sdk.InitBrowserExtension(this)
    }
  }

  get networkId () {
    return this.network?.id
  }

  get sdk () {
    return this._sdk
  }

  // custom network
  async createSdk (params) {
    const sdk = new Sdk(params)
    try {
      const nodeInfo = await sdk.ckbClient.core.rpc.localNodeInfo()
      this._sdk = sdk
      return nodeInfo
    } catch (e) {
      console.warn(e)
      notification.error('Invalid Node URL', '')
    }
  }

  async updateSdk (params) {
    this._sdk = new Sdk({ ...this.network, ...params })
  }

  async disposeSdk (params) {
    this._sdk = null
    if (this.onSdkDisposedCallback) {
      this.onSdkDisposedCallback()
    }
  }

  onSdkDisposed (callback) {
    this.onSdkDisposedCallback = callback
  }

  setNetwork (network, force) {
    if (this.browserExtension && !force) {
      if (redux.getState().network) {
        notification.info(`Please use ${this.browserExtension.name} to switch the network.`)
      }
      return
    }
    if (!network || network.id === redux.getState().network) {
      return
    }

    const cachingKeys = getCachingKeys()
    cachingKeys.filter(key => key.startsWith('contract-') || key.startsWith('account-')).forEach(dropByCacheKey)

    this.network = network
    if (network.id && network.id !== 'dev') {
      this._sdk = new Sdk(network)
    } else {
      this._sdk = null
    }

    redux.dispatch('SELECT_NETWORK', network.id)
    notification.success(`Network`, network.notification)
    headerActions.updateNetwork(network.id)
  }
}

export default new NetworkManager()