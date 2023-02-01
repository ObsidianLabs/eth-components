const { IpcChannel } = require('@obsidians/ipc')
const EthersClient = require('./EthersClient')
const RpcServer = require('./RpcServer')

module.exports = class SdkChannel extends IpcChannel {
  constructor (keypairManager) {
    super('sdk')
    this.explorer = new ExplorerChannel()
    this.rpcServer = new RpcServer(EthersClient, { channel: this, keypairManager })
  }

  setNetwork (option) {
    this.rpcServer.setNetwork(option)
  }

  unsetNetwork () {
    this.rpcServer.unsetNetwork()
  }
}

class ExplorerChannel extends IpcChannel {
  constructor () {
    super('explorer')
  }

  async GET (networkId, query) {
    if (networkId.startsWith('dev')) {
      return { result: [] }
    }

    try {
      return JSON.parse([])
    } catch {
      return { result: [] }
    }
  }
}