import { ethers } from 'ethers'

export default class Client {
  constructor (networkId = '', url) {
    if (!networkId.startsWith('dev')) {
      if (window.ethereum) {
        this.provider = new ethers.providers.Web3Provider(window.ethereum)
        this.provider.isMetaMask = true
      } else {
        this.provider = ethers.getDefaultProvider(networkId, {
          infura: process.env.INFURA_PROJECT_ID
        })
      }
    } else {
      this.provider = ethers.getDefaultProvider(url)
    }
  }

  async getAccount (address) {
    const balance = await this.provider.getBalance(address)
    const code = await this.provider.getCode(address)
    const codeHash = ethers.utils.keccak256(code)
    return { balance, codeHash }
  }
}