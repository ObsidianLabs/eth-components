import { ethers } from 'ethers'

import utils from '../utils'
import signatureProvider from './signatureProvider'

export default class EthTxManager {
  constructor (client) {
    this.client = client
  }

  get provider () {
    return this.client.provider
  }

  async getTransferTx (Contract, { from, to, token, amount }, override) {
    let value
    try {
      if (token === 'core' || !token) {
        value = utils.unit.toValue(amount)
      } else {
        value = utils.format.big(amount).times(utils.format.big(10).pow(token.decimals)).toString()
      }
    } catch {
      throw new Error('The entered amount is invalid.')
    }

    if (token === 'core' || !token) {
      const voidSigner = new ethers.VoidSigner(from, this.provider)
      try {
        return { tx: await voidSigner.populateTransaction({ to, value }) }
      } catch (e) {
        throw utils.parseError(e)
      }
    } else {
      const contract = new Contract({ address: token.address, abi: ERC20 }, this.client)
      return contract.execute('transfer', { array: [to, value] }, { ...override, from })
    }
  }

  async getDeployTx ({ abi, bytecode, amount, parameters }, override) {
    const factory = new ethers.ContractFactory(abi, bytecode)
    let value
    try {
      value = utils.unit.toValue(amount || '0')
    } catch {
      throw new Error('The entered amount is invalid.')
    }
    const tx = await factory.getDeployTransaction(...parameters, { value })
    const voidSigner = new ethers.VoidSigner(override.from, this.provider)

    try {
      return { tx: await voidSigner.populateTransaction(tx) }
    } catch (e) {
      throw utils.parseError(e)
    }
  }

  async estimate (tx) {
    const gasPrice = await this.client.callRpc('eth_gasPrice', [])
    const result = await this.provider.estimateGas(tx)
    return {
      gasLimit: result.toString(),
      gasPrice: BigInt(gasPrice).toString(10),
    }
  }

  sendTransaction ({ tx, getResult }, browserExtension) {
    let pendingTx
    if (this.provider.isMetaMask && browserExtension && browserExtension.currentAccount === tx.from.toLowerCase()) {
      const signer = this.provider.getSigner(tx.from)
      pendingTx = signer.sendTransaction(tx)
    } else {
      const sp = signatureProvider(tx.from)
      pendingTx = sp(tx).then(signedTx => this.provider.sendTransaction(signedTx))
    }

    const promise = pendingTx.then(res => res.hash).catch(e => {
      throw utils.parseError(e)
    })

    promise.mined = async () => {
      const tx = await pendingTx
      const res = {}

      let transaction, height
      try {
        await tx.wait(1)
        transaction = await this.provider.getTransaction(tx.hash)
        height = transaction.blockNumber - 1
      } catch (err) {
        transaction = err.transaction
        const { code, receipt, reason } = err

        height = receipt.blockNumber - 1
        receipt.gasUsed = receipt.gasUsed.toString()
        receipt.cumulativeGasUsed = receipt.cumulativeGasUsed.toString()

        res.code = code
        res.receipt = receipt
        res.error = reason
      }

      delete transaction.confirmations
      transaction.value = transaction.value.toString()
      transaction.gasPrice = transaction.gasPrice.toString()
      transaction.gasLimit = transaction.gasLimit.toString()

      if (getResult) {
        try {
          res.result = await getResult(transaction, height)
        } catch (e) {
          res.error = e.reason
          const parsed = utils.parseError(e)
          if (parsed.reason) {
            res.error = parsed.reason
          }
        }
      }

      res.transaction = transaction
      return res
    }

    promise.executed = async () => {
      const tx = await pendingTx
      const receipt = await this.provider.getTransactionReceipt(tx.hash)
      delete receipt.confirmations
      receipt.gasUsed = receipt.gasUsed.toString()
      receipt.cumulativeGasUsed = receipt.cumulativeGasUsed.toString()
      return receipt
    }

    promise.confirmed = () => pendingTx.then(tx => tx.wait(10))

    return promise
  }
}
