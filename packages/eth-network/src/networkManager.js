import platform from '@obsidians/platform'
import headerActions from '@obsidians/eth-header'
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

  async updateSdk (params) {
    this._sdk = new Sdk({ ...this.network, ...params })
    await new Promise(resolve => {
      const h = setInterval(() => {
        if (!this.sdk) {
          clearInterval(h)
          return
        }
        this.sdk.getStatus().then(() => {
          clearInterval(h)
          resolve()
        })
      }, 1000)
    })
  }

  async disposeSdk (params) {
    if (this.networkId === 'dev') {
      this._sdk = null
    }
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
    if (network.url && network.id && network.id !== 'dev') {
      this._sdk = new Sdk(network)
    } else {
      this._sdk = null
    }

    redux.dispatch('SELECT_NETWORK', network.id)
    notification.success(`Network`, network.notification)
    headerActions.updateNetwork(network.id)
  }

  async updateCustomNetwork ({ url, option = '{}' }) {
    try {
      if (option) {
        option = JSON.parse(option)
      }
    } catch {
      notification.error('Invalid Option', '')
      return
    }
    const status = await this.createSdk({ id: 'custom', url, option })
    
    if (status) {
      redux.dispatch('SELECT_NETWORK', `custom`)
      notification.success(`Network Connected`, `Connected to network at <b>${url}</b>`)
    }

    return status
  }

  async createSdk (params) {
    const sdk = new Sdk(params)
    try {
      const status = await sdk.getStatus()
      this._sdk = sdk
      return status
    } catch (e) {
      console.warn(e)
      notification.error('Invalid Node URL', '')
    }
  }
}

export default new NetworkManager()