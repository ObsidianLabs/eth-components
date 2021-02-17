const { IpcChannel } = require('@obsidians/ipc')

class SdkChannel extends IpcChannel {
  constructor () {
    super('etherscan')
    this.baseUrl = `${process.env.SERVER_URL}/api/v1`
  }

  async GET (networkId, query) {
    if (networkId.startsWith('dev')) {
      return { result: [] }
    }

    const result = await this.fetch(`${this.baseUrl}/etherscan/${networkId}`, query)
    try {
      return JSON.parse(result)
    } catch {
      return { result: [] }
    }
  }
}

module.exports = SdkChannel