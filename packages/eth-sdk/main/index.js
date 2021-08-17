const { IpcChannel } = require('@obsidians/ipc')
const fastify = require('fastify')({ logger: false })
const { JsonRpcEngine, createAsyncMiddleware } = require('json-rpc-engine')
const { ethers } = require('ethers')
const EthersClient = require('./EthersClient')

class SdkChannel extends IpcChannel {
  constructor (keypairManager) {
    super('etherscan')
    this.baseUrl = `${process.env.SERVER_URL}/api/v1`
    this.keypairManager = keypairManager

    this.ethers = null
    this.engine = this._startJsonRpcEngine()
    this._startRpcServer(this.engine)
  }

  setNetwork (option) {
    this.ethers = new EthersClient(option)
  }

  unsetNetwork () {
    this.ethers = null
  }

  _startJsonRpcEngine () {
    const engine = new JsonRpcEngine()
    const middleware = async (req, res, next) => {
      if (!this.ethers) {
        throw new Error('No network is running.')
      } else if (req.method === 'eth_accounts') {
        const keypairs = await this.keypairManager.get()
        res.result = keypairs.map(k => k.address)
      } else if (req.method === 'eth_sendTransaction') {
        const tx = await this.keypairManager.call({ ...req, method: 'signTransaction' })
        const kp = await this.keypairManager.get(tx.from)
        if (!kp) {
          throw new Error(`No keypair for ${tx.from}`)
        }
        const wallet = this.ethers.walletFrom(kp.secret)
        const populated = await wallet.populateTransaction(tx)
        const signed = await wallet.signTransaction(populated)
        res.result = await this.ethers.rpc('eth_sendRawTransaction', [signed])
      } else {
        res.result = await this.ethers.rpc(req.method, req.params)
      }
    }
    engine.push(createAsyncMiddleware(middleware))
    return engine
  }

  _startRpcServer (engine, port = 62743) {
    fastify.post('/', function (request, reply) {
      engine.handle(request.body, function (err, response) {
        if (err) {
          reply.send(err)
        }
        reply.send(response)
      })
    })

    fastify.listen(port, function (err, address) {
      if (err) {
        fastify.log.error(err)
      }
      // fastify.log.info(`server listening on ${address}`)
    })
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