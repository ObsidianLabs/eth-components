import { ethers } from 'ethers'
import utils from './utils'

export default class Contract {
  constructor ({ address, abi }, provider) {
    this.address = address
    this.abi = abi
    this.provider = provider
    this.instance = new ethers.Contract(address, abi, provider)
  }

  async query (method, { array }) {
    let result
    try {
      result = await this.instance.functions[method](...array)
    } catch (e) {
      throw utils.parseError(e)
    }
    return this.parseResult(result, method)
  }

  async execute (method, { array }, override) {
    try {
      const tx = await this.instance.populateTransaction[method](...array, override)
      const voidSigner = new ethers.VoidSigner(override.from, this.provider)
      return {
        tx: await voidSigner.populateTransaction(tx),
        getResult: async (tx, height) => {
          const data = await this.provider.call(tx, height)
          try {
            const result = this.instance.interface.decodeFunctionResult(method, data)
            return this.parseResult(result, method)
          } catch (e) {
            throw utils.parseError(e)
          }
        }
      }
    } catch (e) {
      throw utils.parseError(e)
    }
  }

  parseResult (result, method) {
    const methodAbi = this.abi.find(item => item.name === method)
    const abi = methodAbi && methodAbi.outputs
    const parsed = utils.parseObject(result, abi)
    return {
      raw: result,
      parsed: Object.values(parsed),
    }
  }

  get maxGap () {
    return 100
  }

  async getLogs (event, { from, to }) {
    const filter = this.instance.filters[event.name]()
    try {
      const logs = await this.instance.queryFilter(filter, from, to)
      return logs
    } catch (e) {
      throw utils.parseError(e)
    }
  }
}