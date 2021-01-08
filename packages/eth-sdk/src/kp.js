import { Account } from 'web3'

export default {
  newKeypair () {
    const key = Account.random()
    return {
      address: key.address,
      secret: key.privateKey,
    }
  },
  importKeypair (secret) {
    const key = new Account(secret)
    return {
      address: key.address,
      secret: key.privateKey,
    }
  },
}