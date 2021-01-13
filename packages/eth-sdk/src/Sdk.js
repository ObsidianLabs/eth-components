import { ethers } from 'ethers'

import Client from './Client'
import utils from './utils'

export default class Sdk {
  constructor ({ url, chainId, explorer, id }) {
    this.client = new Client(id, url)
    this.networkId = id
    this.url = url
    this.chainId = chainId
    this.explorer = explorer
  }

  get provider () {
    return this.client.provider
  }

  isValidAddress (address) {
    return ethers.utils.isAddress(address)
  }

  async accountFrom (address) {
    const account = await this.client.getAccount(address)
    return {
      address,
      balance: utils.unit.fromValue(account.balance),
      codeHash: account.code,
    }
  }

  async networkInfo () {
    return await this.provider.getNetwork()
  }

  async getStatus () {
    return await this.provider.getBlock('latest')
  }

  async getTransactionsCount (address) {
    return 0
  }

  async getTransactions (address, page = 1, size = 10) {
    return {
      length: 0,
      list: []
    }
  }

  contractFrom (options) {
  }

  async contract (abi, method, ...args) {
  }
}
