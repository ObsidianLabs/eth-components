import { Conflux } from 'web3'

export default class Client {
  constructor (url, chainId) {
    this.cfx = new Conflux({
      url,
      defaultGasPrice: 100, // The default gas price of your following transactions
      defaultGas: 1000000, // The default gas of your following transactions
      // logger: console,
    })
  }
}