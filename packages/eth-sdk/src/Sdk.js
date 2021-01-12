import { ethers } from 'ethers'

import Client from './Client'

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
      balance: account.balance.toString(),
      codeHash: account.code,
    }
  }

  async trend () {
    return await this.provider.getNetwork()
    // console.log(network)
    // return {}
    // const ipc = new IpcChannel()
    // const result = await ipc.invoke('fetch', `${this.explorer}/plot?interval=514&limit=7`)
    // const json = JSON.parse(result)
    // return json.list[json.total - 1]
  }

  async getStatus () {
    return await this.provider.getBlock()
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
