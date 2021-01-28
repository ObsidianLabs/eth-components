import { ethers } from 'ethers'

import BrowserExtension from './BrowserExtension'
import utils from './utils'
import Client from './Client'
import Contract from './Contract'
import signatureProvider from './signatureProvider'

export default class Sdk {
  constructor ({ url, chainId, explorer, id }) {
    this.client = new Client(id, url)
    this.networkId = id
    this.url = url
    this.chainId = chainId
    this.explorer = explorer
  }

  static InitBrowserExtension (networkManager) {
    if (window.ethereum && window.ethereum.isMetaMask) {
      return new BrowserExtension(networkManager, window.ethereum)
    }
  }

  get provider () {
    return this.client.provider
  }

  isValidAddress (address) {
    return ethers.utils.isAddress(address)
  }

  async networkInfo () {
    return await this.provider.getNetwork()
  }

  async getStatus () {
    return await this.provider.getBlock('latest')
  }

  async accountFrom (address) {
    const account = await this.client.getAccount(address)
    return {
      address,
      balance: utils.unit.fromValue(account.balance),
      codeHash: account.codeHash,
    }
  }

  contractFrom ({ address, abi }) {
    return new Contract({ address, abi }, this.provider)
  }

  async getTransferTransaction ({ from, to, amount }) {
    const value = utils.unit.toValue(amount)
    const voidSigner = new ethers.VoidSigner(from, this.provider)
    return await voidSigner.populateTransaction({ to, value })
  }

  async getDeployTransaction ({ abi, bytecode, parameters }, override) {
    const factory = new ethers.ContractFactory(abi, bytecode)
    const tx = await factory.getDeployTransaction(...parameters)
    const voidSigner = new ethers.VoidSigner(override.from, this.provider)
    return await voidSigner.populateTransaction(tx)
  }

  async estimate (tx) {
    const result = await this.provider.estimateGas(tx)
    return { gasLimit: result.toString() }
  }

  sendTransaction (tx) {
    let pendingTx
    if (this.provider.isMetaMask) {
      const signer = this.provider.getSigner(tx.from)
      pendingTx = signer.sendTransaction(tx)
    } else {
      const sp = signatureProvider(tx.from)
      pendingTx = sp(tx).then(signedTx => this.provider.sendTransaction(signedTx))
    }

    const promise = pendingTx.then(res => res.hash)

    promise.mined = async () => {
      const res = await pendingTx
      await res.wait(1)
      const tx = await this.provider.getTransaction(res.hash)
      delete tx.confirmations
      tx.value = tx.value.toString()
      tx.gasPrice = tx.gasPrice.toString()
      tx.gasLimit = tx.gasLimit.toString()
      return tx
    }

    promise.executed = async () => {
      const res = await pendingTx
      const tx = await this.provider.getTransactionReceipt(res.hash)
      delete tx.confirmations
      tx.gasUsed = tx.gasUsed.toString()
      tx.cumulativeGasUsed = tx.cumulativeGasUsed.toString()
      return tx
    }

    promise.confirmed = () => pendingTx.then(res => res.wait(10))

    return promise
  }

  async getTransactionsCount () {
    return
  }

  async getTransactions (address, page = 0, size = 10) {
    return await this.client.getTransactions(address, page, size)
  }
}
