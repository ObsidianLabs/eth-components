import { ethers } from 'ethers'
import { IpcChannel } from '@obsidians/ipc'

export default class Client {
  constructor (networkId = '', url) {
    if (!networkId.startsWith('dev')) {
      if (window.ethereum) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum)
        this.provider.isMetaMask = true
      } else {
        this.provider = new ethers.providers.InfuraProvider(networkId, {
          projectId: process.env.INFURA_PROJECT_ID
        })
      }
    } else {
      this.provider = ethers.getDefaultProvider(url)
    }
    this.etherscan = new EtherscanProxy(networkId)
  }

  async getAccount (address) {
    const balance = await this.provider.getBalance(address)
    const code = await this.provider.getCode(address)
    const txCount = await this.provider.getTransactionCount(address)
    const codeHash = ethers.utils.keccak256(code)
    return { balance, txCount, codeHash }
  }

  async getTransactions (address, page, size) {
    const result = await this.etherscan.getHistory(address, page, size)
    return {
      length: 0,
      list: result.result
    }
  }
}


class EtherscanProxy {
  constructor (networkId) {
    this.networkId = networkId
    this.channel = new IpcChannel('etherscan')
  }

  async getHistory (address, page = 0, size = 10) {
    const query = {
      module: 'account',
      action: 'txlist',
      address,
      startblock: 0,
      endblock: 99999999,
      page: page + 1,
      offset: size,
      sort: 'desc'
    }
    return await this.channel.invoke('GET', this.networkId, query)
  }
}
