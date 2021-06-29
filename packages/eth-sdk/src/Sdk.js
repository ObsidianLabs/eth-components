import { ethers } from 'ethers'
import { IpcChannel } from '@obsidians/ipc'

import utils from './utils'
import Client from './Client'
import rpc from './rpc'
import Contract from './Contract'
import signatureProvider from './signatureProvider'
import BrowserExtension from './BrowserExtension'
import ERC20 from './redux/abi/ERC20.json'
import tokenList from './token/tokenlist.json'

let browserExtension

export default class Sdk {
  constructor ({ url, chainId, explorer, id }) {
    this.client = new Client(id, url)
    this.networkId = id
    this.chainId = chainId
    this.explorer = explorer
  }

  static InitBrowserExtension (networkManager) {
    if (window.ethereum && window.ethereum.isMetaMask) {
      browserExtension = new BrowserExtension(networkManager, window.ethereum)
      return browserExtension
    }
  }

  get url () {
    return this.provider && this.provider.connection && this.provider.connection.url
  }

  get provider () {
    return this.client.provider
  }

  isValidAddress (address) {
    return ethers.utils.isAddress(address)
  }

  async callRpc (method, parameters) {
    const params = rpc.prepare(parameters)
    return await this.provider.send(method, params)
  }

  async networkInfo () {
    return await this.provider.getNetwork()
  }

  async getStatus () {
    return await this.provider.getBlock('latest')
  }

  async latest () {
    const status = await this.getStatus()
    return status.number
  }

  async accountFrom (address) {
    const account = await this.client.getAccount(address)
    return {
      address,
      balance: utils.unit.fromValue(account.balance),
      txCount: BigInt(account.txCount).toString(10),
      codeHash: account.codeHash === '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' ? null : account.codeHash,
    }
  }

  contractFrom ({ address, abi }) {
    return new Contract({ address, abi }, this.provider)
  }

  async getTransferTransaction ({ from, to, token, amount }, override) {
    if (token === 'core' || !token) {
      const value = utils.unit.toValue(amount)
      const voidSigner = new ethers.VoidSigner(from, this.provider)
      return await voidSigner.populateTransaction({ to, value })
      } else {
      const value = utils.format.big(amount).times(utils.format.big(10).pow(token.decimals)).toString()
      const contract = new Contract({ address: token.address, abi: ERC20 }, this.provider)
      return contract.execute('transfer', { array: [to, value] }, { ...override, from })
    }
  }

  async getDeployTransaction ({ abi, bytecode, parameters }, override) {
    const factory = new ethers.ContractFactory(abi, bytecode)
    const tx = await factory.getDeployTransaction(...parameters)
    const voidSigner = new ethers.VoidSigner(override.from, this.provider)
    return await voidSigner.populateTransaction(tx)
  }

  async estimate (tx) {
    const gasPrice = await this.callRpc('eth_gasPrice')
    const result = await this.provider.estimateGas(tx)
    return {
      gasLimit: result.toString(),
      gasPrice: BigInt(gasPrice).toString(10),
    }
  }

  sendTransaction (tx) {
    let pendingTx
    if (this.provider.isMetaMask && browserExtension && browserExtension.currentAccount === tx.from.toLowerCase()) {
      const signer = this.provider.getSigner(tx.from)
      pendingTx = signer.sendTransaction(tx)
    } else {
      const sp = signatureProvider(tx.from)
      pendingTx = sp(tx).then(signedTx => this.provider.sendTransaction(signedTx))
    }

    const promise = pendingTx.then(res => res.hash)

    promise.mined = async () => {
      const res = await pendingTx
      try {
        await res.wait(1)
      } catch (err) {
        const { reason, code, transaction: tx, receipt } = err
        tx.value = tx.value.toString()
        tx.gasPrice = tx.gasPrice.toString()
        tx.gasLimit = tx.gasLimit.toString()
        receipt.gasUsed = receipt.gasUsed.toString()
        receipt.cumulativeGasUsed = receipt.cumulativeGasUsed.toString()
        return { error: reason, code, tx, receipt }
      }
      const tx = await this.provider.getTransaction(res.hash)
      delete tx.confirmations
      tx.value = tx.value.toString()
      tx.gasPrice = tx.gasPrice.toString()
      tx.gasLimit = tx.gasLimit.toString()
      return tx
    }

    promise.executed = async () => {
      const res = await pendingTx
      const receipt = await this.provider.getTransactionReceipt(res.hash)
      delete receipt.confirmations
      receipt.gasUsed = receipt.gasUsed.toString()
      receipt.cumulativeGasUsed = receipt.cumulativeGasUsed.toString()
      return receipt
    }

    promise.confirmed = () => pendingTx.then(res => res.wait(10))

    return promise
  }

  async getTransactions (address, page = 0, size = 10) {
    return await this.client.getTransactions(address, page, size)
  }

  async tokenInfo (address) {
    if (this.chainId !== 1) {
      return
    }
    const token = tokenList.tokens.find(t => t.address.toLowerCase() === address)
    if (token) {
      token.icon = token.logoURI
      token.address = token.address.toLowerCase()
      token.totalSupply = await this.client.getTokenTotalSupply(address)
      return token
    }
  }

  async getTokens (address) {
    if (this.chainId !== 1) {
      return
    }
    const ipc = new IpcChannel()
    const url = `https://services.tokenview.com/vipapi/eth/address/tokenbalance/${address}?apikey=${process.env.TOKENVIEW_API_TOKEN}`
    let json
    try {
      const result = await ipc.invoke('fetch', url)
      json = JSON.parse(result)
    } catch {
      return
    }
    if (json.code !== 1) {
      return
    }
    return json.data.map(t => {
      const token = tokenList.tokens.find(token => token.address.toLowerCase() === t.tokenInfo.h)
      return {
        type: 'ERC20',
        balance: t.balance,
        name: t.tokenInfo.f,
        symbol: t.tokenInfo.s,
        decimals: Number(t.tokenInfo.d),
        address: t.tokenInfo.h,
        icon: token && token.logoURI,
      }
    })
  }
}
