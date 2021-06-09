import { ethers } from 'ethers'

export default class Contract {
  constructor ({ address, abi }, provider) {
    this.address = address
    this.abi = abi
    this.provider = provider
    this.instance = new ethers.Contract(address, abi, provider)
  }

  async query (method, { array }) {
    const result = await this.instance.functions[method](...array)
    const methodAbi = this.abi.find(item => item.name === method)
    const outputs = methodAbi && methodAbi.outputs
    return Object.fromEntries(outputs.map(({ name, type }, index) => {
      let value = result[index]
      if (type.startsWith('uint') || type.startsWith('int')) {
        value = value.toString()
      }
      return [name || `(param${index})`, { type, value }]
    }))
  }

  async execute (method, { array }, override) {
    const tx = await this.instance.populateTransaction[method](...array, override)
    const voidSigner = new ethers.VoidSigner(override.from, this.provider)
    return await voidSigner.populateTransaction(tx)
  }

  async getLogs (event, { from, to }) {
    const logs = await this.instance.queryFilter(event.name, from, to)
    return logs
  }
}