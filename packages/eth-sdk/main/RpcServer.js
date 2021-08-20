const fastify = require('fastify')({ logger: false })
const { JsonRpcEngine, createAsyncMiddleware } = require('json-rpc-engine')

module.exports = class RpcServer {
  constructor (Client, keypairManager, rpcMap) {
    this.Client = Client
    this.keypairManager = keypairManager

    this.client = null
    this.engine = this._startJsonRpcEngine(rpcMap)
    this._start(this.engine)
  }

  setNetwork (option) {
    this.client = new this.Client(option)
  }

  unsetNetwork () {
    this.client = null
  }

  _startJsonRpcEngine (rpcMap = {}) {
    const engine = new JsonRpcEngine()
    const middleware = async (req, res, next) => {
      if (rpcMap[req.method]) {
        req.method = rpcMap[req.method]
      }
      if (!this.client) {
        throw new Error('No network is running.')
      } else if (req.method === 'eth_accounts') {
        const keypairs = await this.keypairManager.get()
        res.result = keypairs.map(k => k.address).filter(addr => addr.startsWith('atp'))
      } else if (req.method === 'eth_sendTransaction') {
        const tx = await this.keypairManager.call({ ...req, method: 'signTransaction' })
        const kp = await this.keypairManager.get(tx.from)
        if (!kp) {
          throw new Error(`No keypair for ${tx.from}`)
        }
        const signed = await this.client.sign(tx, kp.secret)
        res.result = await this.client.sendRawTransaction(signed)
      } else {
        res.result = await this.client.rpc(req.method, req.params)
      }
    }
    engine.push(createAsyncMiddleware(middleware))
    return engine
  }

  _start (engine, port = 62743) {
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
}
