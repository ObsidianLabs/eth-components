import { IpcChannel } from '@obsidians/ipc'
import notification from '@obsidians/notification'

let current
const channel = new IpcChannel('sdk')
channel.off('error')
channel.on('error', msg => {
  if (current) {
    current.dismiss()
  }
  current = notification.error('Error', msg)
})

export default function makeSdk({
  kp,
  networks,
  customNetworks = [],
  utils,
  rpc,
  namedContracts = {},
  Client,
  Contract,
  TxManager,
  BrowserExtension,
}) {
  let browserExtension

  return class Sdk {
    static get kp() { return kp }
    static get networks() { return networks }
    static get customNetworks() { return customNetworks }

    static InitBrowserExtension(networkManager) {
      browserExtension = BrowserExtension && BrowserExtension.Init(networkManager)
      return browserExtension
    }

    constructor({ id, ...option }) {
      this.client = new Client({ networkId: id, ...option })
      this.networkId = id
      this.txManager = new TxManager(this.client)
      this.supportEIP1559 = true
    }

    dispose() {
      this.client.dispose()
    }

    get url() { return this.client.url }
    get chainId() { return this.client.chainId }

    get utils() { return utils }
    get rpc() { return rpc }
    get namedContracts() { return namedContracts }
    get txOptions() {
      if (process.env.CHAIN_NAME === 'Ethereum') {
        return {
          title: 'Gas',
          list: [
            {
              name: 'gasLimit',
              alias: 'gas',
              className: 'col-4',
              label: 'Gas Limit',
              icon: 'fas fa-burn',
              placeholder: 'Default: 1,000,000',
              default: '1000000'
            },
            ...(!this.supportEIP1559 ? [] : [{
              name: 'maxPriorityFeePerGas',
              className: 'col-4',
              label: 'Tip',
              icon: 'fas fa-hand-holding-usd',
              placeholder: 'max priority fee per gas',
              default: ''
            },
            {
              name: 'maxFeePerGas',
              className: 'col-4',
              label: 'Max Fee',
              icon: 'fas fa-sack-dollar',
              placeholder: 'max fee per gas',
              default: ''
            }])
          ]
        }
      } else {
        return utils.txOptions
      }
    }

    isValidAddress(address) {
      return utils.isValidAddress(address, this.chainId)
    }

    async networkInfo() {
      return await this.client.networkInfo()
    }

    async getStatus() {
      return await this.client.getStatus()
    }

    async updateEIP1559Support() {
      const latestInfo = await this.client.getStatus()
      this.supportEIP1559 = latestInfo.baseFeePerGas !== undefined
    }

    async latest() {
      return await this.client.latest()
    }

    async accountFrom(address) {
      return await this.client.getAccount(address)
    }

    contractFrom({ address, abi }) {
      return new Contract({ address, abi }, this.client)
    }

    async getTransferTransaction(...args) {
      return await this.txManager.getTransferTx(Contract, ...args)
    }

    async getDeployTransaction(...args) {
      return await this.txManager.getDeployTx(...args)
    }

    async estimate(arg) {
      return await this.txManager.estimate(arg)
    }

    sendTransaction(arg) {
      return this.txManager.sendTransaction(arg, browserExtension)
    }

    async getTransactions(address, page = 0, size = 10) {
      return await this.client.getTransactions(address, page, size)
    }

    async getTokens(address) {
      return await this.client.getTokens(address)
    }

    async getTokenInfo(address) {
      return await this.client.getTokenInfo(address)
    }

    async callRpc(method, parameters) {
      const params = rpc.prepare(parameters, false, this)
      return await this.client.callRpc(method, params)
    }
  }
}