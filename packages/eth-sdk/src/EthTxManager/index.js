import { ethers } from 'ethers'
import utils from '../utils'
import signatureProvider from './signatureProvider'

export default class EthTxManager {
  constructor(client) {
    this.client = client
  }

  get provider() {
    return this.client.provider
  }

  recombineErrorMsg (e) {
    const recombineMsg = [
      {originalMsg: ['transaction underpriced'], message: 'Please increase transfer amount.'},
      {originalMsg: ['header not found'], message: 'Please try again.'},
      {
        originalMsg: [
          'insufficient funds',
          'insufficient balance',
          'NotEnoughCash',
          'kind: GasPayment(OutOfFund), gas_used: 0',
          'gas required exceeds allowance',
          'NotEnoughBaseGas',
          'out of gas',
        ],
        message: 'Insufficient balance.'
      }
    ]
    let errMsg = null
    if (e?.message.includes('[ethjs-query]')) {
      try {
        errMsg = JSON.parse(e.message.substring(e.message.indexOf('{'), e.message.lastIndexOf('}') + 1))
      } catch {}
    }
    const message = recombineMsg.find(({ originalMsg }) => (
      originalMsg.some(msg =>
        e?.error?.message?.includes(msg) || e?.error?.reason?.includes(msg) || errMsg?.value?.data?.message?.includes(msg)
        || e?.error?.data?.message?.includes(msg) || e?.data?.message?.includes(msg) || e?.message?.includes(msg)
      )
    ))?.message
    return (message && {message}) || (e?.error?.data?.message && e.error.data)
  }

  async getTransferTx(Contract, { from, to, token, amount }, override) {
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
        const populated = await voidSigner.populateTransaction({ to, value })
        const nonce = await this.provider.getTransactionCount(from)
        populated.nonce = nonce
        return { tx: populated }
      } catch (e) {
        throw this.recombineErrorMsg(e) || utils.parseError(e)
      }
    } else {
      const contract = new Contract({ address: token.address, abi: ERC20 }, this.client)
      return contract.execute('transfer', { array: [to, value] }, { ...override, from })
    }
  }

  async getDeployTx({ abi, bytecode, amount, parameters }, override) {
    const gasPrice = await this.client.callRpc('eth_gasPrice', [])
    const factory = new ethers.ContractFactory(abi, bytecode)
    let value
    try {
      value = utils.unit.toValue(amount || '0')
    } catch {
      throw new Error('The entered amount is invalid.')
    }

    try {
      const tx = await factory.getDeployTransaction(...parameters, { value })
      tx.gasPrice = gasPrice
      const voidSigner = new ethers.VoidSigner(override.from, this.provider)
      const populated = await voidSigner.populateTransaction(tx)
      const nonce = await this.provider.getTransactionCount(override.from)
      populated.nonce = nonce
      return { tx: populated }
    } catch (e) {
      throw this.recombineErrorMsg(e) || utils.parseError(e)
    }
  }

   
  async estimate({ tx }) {
    const gasPrice = await this.client.callRpc('eth_gasPrice', [])
    const supportsEIP1559 = await this.provider.getBlock("latest").baseFeePerGas !== undefined
    const result = await this.provider.estimateGas(tx)
    const feeData = await this.provider.getFeeData()
    const balance = await this.provider.getBalance(tx.from)
    if (BigInt(feeData.maxPriorityFeePerGas || 0) < BigInt(gasPrice)) {
      const tip = BigInt(feeData.maxFeePerGas || 0) - BigInt(feeData.maxPriorityFeePerGas || 0)
      feeData.maxPriorityFeePerGas = '0x' + BigInt(gasPrice).toString(16)
      feeData.maxFeePerGas = '0x' + (BigInt(gasPrice) + tip).toString(16)
    }
    if (!supportsEIP1559) {
      return {
        gasLimit: result.toString(),
        maxFeePerGas: null,
        maxPriorityFeePerGas: null,
        balance: balance?.toString(),
      }
    }
    return {
      gasLimit: result.toString(),
      maxFeePerGas: BigInt(feeData.maxFeePerGas).toString(10),
      maxPriorityFeePerGas: BigInt(feeData.maxPriorityFeePerGas || 0).toString(10),
      balance: balance?.toString(),
    }
  }

  sendTransaction({ tx, getResult }, browserExtension) {
    let pendingTx
    if (this.provider.isMetaMask && browserExtension && browserExtension.currentAccount === tx.from.toLowerCase()) {
      const signer = this.provider.getSigner(tx.from)
      pendingTx = signer.sendTransaction(tx)
    } else {
      const sp = signatureProvider(tx.from)
      pendingTx = sp(tx).then(signedTx => this.provider.sendTransaction(signedTx))
    }

    const promise = pendingTx.then(res => res.hash).catch(e => {
      throw this.recombineErrorMsg(e) || utils.parseError(e)
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
      if (transaction.gasPrice) {
        transaction.gasPrice = transaction.gasPrice.toString()
      }
      if (transaction.maxFeePerGas) {
        transaction.maxFeePerGas = transaction.maxFeePerGas.toString()
      }
      if (transaction.maxPriorityFeePerGas) {
        transaction.maxPriorityFeePerGas = transaction.maxPriorityFeePerGas.toString()
      }
      transaction.gasLimit = transaction.gasLimit.toString()

      if (getResult) {
        delete transaction.gasPrice
        try {
          res.result = await getResult(transaction, height)
        } catch (e) {
          res.error = e.reason
          const parsed = this.recombineErrorMsg(e) || utils.parseError(e)
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
