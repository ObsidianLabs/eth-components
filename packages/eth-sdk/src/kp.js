import { ethers } from 'ethers'
import { IpcChannel } from '@obsidians/ipc'

import utils from './utils'

const channel = new IpcChannel('keypair')

export default {
  async newKeypair (_, secretType) {
    if (secretType === 'mnemonic') {
      const extraEntropy = utils.format.bytesFromHex(await channel.invoke('post', 'new-secret'))
      const wallet = ethers.Wallet.createRandom({ extraEntropy })
      const { address, mnemonic } = wallet
      const secret = mnemonic.phrase
      console.log(mnemonic.path)
      return {
        address: address.toLowerCase(),
        secret,
        secretName: 'Mnemonic',
      }
    } else {
      const secret = await channel.invoke('post', 'new-secret')
      const address = ethers.utils.computeAddress(secret)
      return {
        address: address.toLowerCase(),
        secret,
        secretName: 'Private Key',
      }
    }
  },
  importKeypair (secret) {
    if (secret.startsWith('0x')) {
      const address = ethers.utils.computeAddress(secret)
      return {
        address: address.toLowerCase(),
        secret,
        secretName: 'Private Key',
      }
    } else {
      const wallet = ethers.Wallet.fromMnemonic(secret)
      const { address, mnemonic } = wallet
      return {
        address: address.toLowerCase(),
        secret: mnemonic.phrase,
        secretName: 'Mnemonic',
      }
    }
  },
  walletFrom (secret) {
    if (secret.startsWith('0x')) {
      return new ethers.Wallet(secret)
    } else {
      return ethers.Wallet.fromMnemonic(secret)
    }
  }
}