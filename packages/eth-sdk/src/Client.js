import { ethers } from 'ethers'

export default class Client {
  constructor (networkId, url) {
    if (networkId !== 'dev') {
      this.provider = ethers.getDefaultProvider(networkId, {
        infura: process.env.INFURA_PROJECT_ID
      })
    } else {
      this.provider = ethers.getDefaultProvider(url)
    }
  }

  async getAccount (address) {
    const balance = await this.provider.getBalance(address)
    return { balance, code: '' }
  }
}