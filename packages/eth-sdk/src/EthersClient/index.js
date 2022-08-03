import { ethers, providers, BigNumber } from 'ethers'
import getCeloProvider from './compatible-celo'
import platform from '@obsidians/platform'
import { IpcChannel } from '@obsidians/ipc'
import redux from '@obsidians/redux'
import { format } from 'js-conflux-sdk'
import notification from '@obsidians/notification'
import { t } from '@obsidians/i18n'
import networks from '../networks'
import utils from '../utils'
import tokenlist from './tokenlist.json'

const { REACT_APP_SERVER_URL } = process.env
const chainsConfluxtName = ['confluxtest', 'confluxmain']
const chainsHarmonyName = ['harmonytest', 'harmonymain']
const { fromBech32 } = require('@harmony-js/crypto')

export default class EthersClient {
  constructor(option) {
    const { networkId = '', chainId, url, group = '' } = option
    this.networkId = networkId
    this.chainId = chainId
    this.rpcUrl = url
    const metaMaskGetLogsUnavailable = ['optimismmain', 'moonrivermain', 'moonbeammain']
    const useWeb3Provider = window.ethereum && networkId !== 'custom'
  
    if (useWeb3Provider) {
      this.provider = new ethers.providers.Web3Provider(window.ethereum, 'any')
      this.provider.isMetaMask = true
      if (metaMaskGetLogsUnavailable.includes(networkId)) this.getLogsDefaultProvider = ethers.getDefaultProvider(url)
    } else {
      this.provider = url ? ethers.getDefaultProvider(url)
        : new ethers.providers.InfuraProvider(networkId, {
        projectId: process.env.INFURA_PROJECT_ID
      })
    }

    this.explorer = new ExplorerProxy(networkId)

    if (platform.isDesktop) {
      this.channel = new IpcChannel('sdk')
      this.channel.invoke('setNetwork', option)
    } else {
      this.channel = new IpcChannel()
    }
  }

  get url() {
    return this.provider && this.provider.connection && this.provider.connection.url
  }

  dispose() {
    if (platform.isDesktop) {
      this.channel.invoke('unsetNetwork')
    }
  }

  async networkInfo() {
    return await this.provider.getNetwork()
  }

  async getStatus() {
    let provider = this.provider
    // check if it's Celo ChainId, Celo chain needs to modify the provide
    if (this.rpcUrl && ['https://rpc.ankr.com/celo', 'https://forno.celo.org'].includes(this.rpcUrl)) {
      provider = getCeloProvider(this.rpcUrl, providers, BigNumber)
    }
    try {
      return await provider.getBlock('latest')
    } catch (error) {
      throw error('fetch network status failed', error)
    }
  }

  async latest() {
    try {
      const { number } = await this.getStatus()
      return number
    } catch (error) {
      throw error('fetch latest block failed', error)
    }
  }

  async getAccount(address) {
    const balance = await this.provider.getBalance(address)
    const code = await this.provider.getCode(address)
    const nonce = await this.provider.getTransactionCount(address)
    const codeHash = ethers.utils.keccak256(code)
    return {
      address,
      balance: utils.unit.fromValue(balance),
      nonce: BigInt(nonce).toString(10),
      codeHash: codeHash === '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' ? null : codeHash,
    }
  }

  async getTransactions(address, page, size) {
    address = address.toLowerCase()
    const isSupportedChain = networks.find(item => item.id === this.networkId)
    if (!isSupportedChain) {
      notification.error(t('network.custom.unsupportedNetwork'), t('network.custom.unsupportedNetworkText'))
      return { length: 0, list: [] }
    }

    if (this.networkId.startsWith('dev')) {
      const { queue } = redux.getState()
      const txs = queue.getIn([this.networkId, 'txs'])
      if (!txs) {
        return { length: 0, list: [] }
      }

      const filtered = txs.filter(tx => {
        const from = tx.getIn(['data', 'transaction', 'from']) || ''
        const to = tx.getIn(['data', 'transaction', 'to']) || ''
        return tx.get('status') === 'CONFIRMED' &&
          (address === from.toLowerCase() || address === to.toLowerCase())
      })

      const list = filtered.map(tx => ({
        ...tx.getIn(['data', 'transaction']).toJS(),
        ...tx.getIn(['data', 'receipt']).toJS(),
        timeStamp: tx.get('ts'),
        method: tx.getIn(['data', 'functionName']),
      })).toArray()

      return { length: list.length, list }
    }

    const result = await this.explorer.getHistory(address, page, size)
    if (utils.isServerError(result.message) || result.status === 500) notification.error(t('network.network.serveBusy'), t('network.network.errorText'))
    const isHarmony = chainsHarmonyName.includes(this.networkId)
    const isConflux = chainsConfluxtName.includes(this.networkId)
    let list = result.result ? (isHarmony ? result.result.transactions : result.result) : (result.list || [])
    if (isHarmony || isConflux) {
      list.map(elem => {
        if (isConflux) {
          elem.from && (elem.from = format.hexAddress(elem.from))
          elem.to && (elem.to = format.hexAddress(elem.to))
          elem.contractCreated && (elem.contractAddress = format.hexAddress(elem.contractCreated))
          elem.blockNumber = elem.epochNumber
          elem.methodString = elem.method
          elem.timeStamp = elem.timestamp
          elem.method = ''
        }
        if (isHarmony) {
          elem.from && (elem.from = fromBech32(elem.from))
          elem.to && (elem.to = fromBech32(elem.to))
          elem.timeStamp = elem.timestamp
          elem.hash = elem.ethHash
          elem.value = elem.value + ""
        }
      })
    }
    return { length: 0, list }
  }

  async getTokens(address) {
    if (this.chainId !== 1) {
      return
    }
    const url = `https://services.tokenview.com/vipapi/eth/address/tokenbalance/${address}?apikey=${process.env.TOKENVIEW_API_TOKEN}`
    let json
    try {
      const result = await this.channel.invoke('fetch', url)
      json = JSON.parse(result)
    } catch {
      return
    }
    if (json.code !== 1) {
      return
    }
    return json.data.map(t => {
      const token = tokenlist.tokens.find(token => token.address.toLowerCase() === t.tokenInfo.h)
      return {
        type: 'ERC20',
        balance: t.balance,
        name: t.tokenInfo.f,
        symbol: t.tokenInfo.s,
        decimals: Number(t.tokenInfo.d),
        address: t.tokenInfo.h,
        icon: token && token.logoURI,
      }
    })
  }

  async getTokenInfo(address) {
    if (this.chainId !== 1) {
      return
    }
    const token = tokenlist.tokens.find(t => t.address.toLowerCase() === address)
    if (token) {
      token.icon = token.logoURI
      token.address = token.address.toLowerCase()
      token.totalSupply = await this._getTokenTotalSupply(address)
      return token
    }
  }

  async _getTokenTotalSupply(address) {
    const result = await this.explorer.getTokenTotalSupply(address)
    return result.result
  }

  async callRpc(method, params) {
    return await this.provider.send(method, params)
  }
}


class ExplorerProxy {
  constructor(networkId) {
    this.networkId = networkId
    this.channel = new IpcChannel('explorer')
  }

  async getHistory(address, page = 0, size = 10) {
    const currentNetworkId = (this.networkId === 'moonrivertest' || this.networkId === 'moonbeamtest') ? 'moonbasetest' : this.networkId
    let query = {
      module: 'account',
      action: 'txlist',
      startblock: 0,
      endblock: 99999999,
      page: page + 1,
      offset: size,
      sort: 'desc'
    }
    if (chainsConfluxtName.includes(currentNetworkId)) {
      query.accountAddress = address
      query.skip = page * size
    } else {
      query.address = address
    }

    if (chainsHarmonyName.includes(currentNetworkId)) {
      query.page -= 1
      if (platform.isDesktop) {
        const response = await fetch(`${REACT_APP_SERVER_URL}/api/v1/harmony/explorer/${currentNetworkId}?${new URLSearchParams(query)}`,{method: 'POST'})
        return await response.json()
      } else {
        return await this.channel.invoke('POST', currentNetworkId, query)
      }
    } else {
      const response = await fetch(`${REACT_APP_SERVER_URL}/api/v1/explorer/${currentNetworkId}?${new URLSearchParams(query)}`)
      return await response.json()
    }
    // TODO: confirm with the infrua service
    // return await this.channel.invoke('GET', this.networkId, query)
  }

  async getTokenTotalSupply(address) {
    const query = {
      module: 'stats',
      action: 'tokensupply',
      contractaddress: address,
    }
    return await this.channel.invoke('GET', this.networkId, query)
  }
}
