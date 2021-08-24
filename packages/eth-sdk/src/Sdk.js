import { ethers } from 'ethers'
import { IpcChannel } from '@obsidians/ipc'
import redux from '@obsidians/redux'

import networks, { customNetworks } from './networks'
import kp from './kp'
import utils from './utils'
import txOptions from './txOptions'
import Client from './Client'
import rpc from './rpc'
import Contract from './Contract'
import signatureProvider from './signatureProvider'
import BrowserExtension from './BrowserExtension'
import ERC20 from './redux/abi/ERC20.json'
import tokenList from './token/tokenlist.json'

let browserExtension

export default class Sdk {
  constructor ({ id, url, chainId, explorer }) {
    this.client = new Client({ networkId: id, url })
    this.networkId = id
    this.chainId = chainId
    this.explorer = !url
  }

  dispose () {
    this.client.dispose()
  }

  static get kp () { return kp }
  static get networks () { return networks }
  static get customNetworks () { return customNetworks }

  static InitBrowserExtension (networkManager) {
    if (window.ethereum && window.ethereum.isMetaMask) {
      browserExtension = new BrowserExtension(networkManager, window.ethereum)
      return browserExtension
    }
  }

  get utils () { return utils }
  get txOptions () { return txOptions }
  get rpc () { return rpc }
  get namedContracts () { return {} }

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
      nonce: BigInt(account.nonce).toString(10),
      codeHash: account.codeHash === '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470' ? null : account.codeHash,
    }
  }

  contractFrom ({ address, abi }) {
    return new Contract({ address, abi }, this.provider)
  }

  async getTransferTransaction ({ from, to, token, amount }, override) {
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
      const contract = new Contract({ address: token.address, abi: ERC20 }, this.provider)
      return contract.execute('transfer', { array: [to, value] }, { ...override, from })
    }
  }

  async getDeployTransaction ({ abi, bytecode, amount, parameters }, override) {
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

  async estimate ({ tx }) {
    const gasPrice = await this.callRpc('eth_gasPrice')
    const result = await this.provider.estimateGas(tx)
    return {
      gasLimit: result.toString(),
      gasPrice: BigInt(gasPrice).toString(10),
    }
  }

  sendTransaction ({ tx, getResult }) {
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

  async getTransactions (address, page = 0, size = 10) {
    address = address.toLowerCase()
    if (this.networkId.startsWith('dev')) {
      const { queue, uiState } = redux.getState()
      const networkId = uiState.get('localNetwork').params.id
      const txs = queue.getIn([networkId, 'txs'])
      if (!txs) {
        return { length: 0, list: [] }
      }

      const filtered = txs.filter(tx => {
        const from = tx.getIn(['data', 'transaction', 'from']) || ''
        const to = tx.getIn(['data', 'transaction', 'to']) || ''
        return tx.get('status') === 'CONFIRMED' &&
          (address === from.toLowerCase() || address === to.toLowerCase())
      })

      const list = filtered.map(tx => ({
        ...tx.getIn(['data', 'transaction']).toJS(),
        ...tx.getIn(['data', 'receipt']).toJS(),
        timeStamp: tx.get('ts'),
        method: tx.getIn(['data', 'functionName']),
      })).toArray()

      return { length: list.length, list }
    }

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
