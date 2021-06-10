import keypairManager from '@obsidians/keypair'
import { ethers } from 'ethers'

import kp from './kp'

export default function signatureProvider (address) {
  return async tx => {
    const secret = await keypairManager.getSecret(address.toLowerCase())
    const wallet = kp.walletFrom(secret)
    return await wallet.signTransaction(tx)
  }
}