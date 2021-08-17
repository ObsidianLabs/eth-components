const { ethers } = require('ethers')

module.exports = class EthersClient {
  constructor ({ networkId = '', url }) {
    if (url) {
      this.provider = ethers.getDefaultProvider(url)
    } else {
      this.provider = new ethers.providers.InfuraProvider(networkId, {
        projectId: process.env.INFURA_PROJECT_ID
      })
    }
  }

  async rpc (method, params) {
    return await this.provider.send(method, params)
  }

  walletFrom (secret) {
    let wallet
    if (secret.startsWith('0x')) {
      wallet = new ethers.Wallet(secret)
    } else {
      wallet = ethers.Wallet.fromMnemonic(secret)
    }
    return wallet.connect(this.provider)
  }

  async send (tx) {
    return await this.provider.sendTransaction(tx)
  }
}