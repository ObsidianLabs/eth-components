import keypairManager from '@obsidians/keypair'
import { utils } from 'web3'

export default function signatureProvider (address) {
  return async tx => {
    const privateKey = await keypairManager.getSecret(address)
    return utils.sign.ecdsaSign(utils.sign.sha3(tx.encode(false)), utils.format.buffer(privateKey))
  }
}