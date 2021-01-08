const fs = require('fs')
const path = require('path')
const os = require('os')
const TOML = require('@iarna/toml')

const { IpcChannel } = require('@obsidians/ipc')
const { DockerImageChannel } = require('@obsidians/docker')

class InstanceManager extends IpcChannel {
  constructor () {
    super('node-instance')
    this.dockerChannel = new DockerImageChannel(process.env.DOCKER_IMAGE_NODE)
  }

  async create ({ name, version, miner, genesis_secrets, chain = 'dev' }) {
    const tmpdir = os.tmpdir()
    const configPath = path.join(tmpdir, `conflux.toml`)
    const logPath = path.join(tmpdir, `log.yaml`)
    const genesis = path.join(tmpdir, 'genesis_secrets.txt')
    const PROJECT = process.env.PROJECT

    await this.exec(`docker volume create --label version=${version},chain=${chain} ${PROJECT}-${name}`)

    await this.exec(`docker run -di --rm --name ${PROJECT}-config-${name} -v ${PROJECT}-${name}:/${PROJECT}-node ${process.env.DOCKER_IMAGE_NODE}:${version} /bin/bash`)

    await this.exec(`docker cp ${PROJECT}-config-${name}:/root/run/default.toml ${configPath}`)
    await this.exec(`docker cp ${PROJECT}-config-${name}:/root/run/log.yaml ${logPath}`)
    await this.exec(`docker cp ${PROJECT}-config-${name}:/root/run/genesis_secrets.txt ${genesis}`)

    const configStr = fs.readFileSync(configPath, 'utf8')
    const config = TOML.parse(configStr)
    config.mode = 'dev'
    config.chain_id = 0
    config.mining_author = miner.replace('0x', '')
    config.genesis_secrets = 'genesis_secrets.txt'

    fs.writeFileSync(configPath, TOML.stringify(config))
    fs.writeFileSync(genesis, genesis_secrets.map(k => k.substr(2)).join('\n') + '\n')

    await this.exec(`docker cp ${configPath} ${PROJECT}-config-${name}:/${PROJECT}-node/default.toml`)
    await this.exec(`docker cp ${logPath} ${PROJECT}-config-${name}:/${PROJECT}-node/log.yaml`)
    await this.exec(`docker cp ${genesis} ${PROJECT}-config-${name}:/${PROJECT}-node/genesis_secrets.txt`)
    await this.exec(`docker stop ${PROJECT}-config-${name}`)

    fs.unlinkSync(genesis)
  }

  async list (chain = 'dev') {
    const { logs: volumes } = await this.exec(`docker volume ls --format "{{json . }}"`)
    const instances = volumes.split('\n').filter(Boolean).map(JSON.parse).filter(x => x.Name.startsWith(`${process.env.PROJECT}-`))
    const instancesWithLabels = instances.map(i => {
      const labels = {}
      i.Labels.split(',').forEach(x => {
        const [name, value] = x.split('=')
        labels[name] = value
      })
      i.Labels = labels
      return i
    })
    return instancesWithLabels.filter(x => x.Labels.chain === chain)
  }

  async readConfig ({ name, version }) {
    const PROJECT = process.env.PROJECT
    const configPath = path.join(os.tmpdir(), `conflux.toml`)
    try {
      fs.unlinkSync(configPath)
    } catch (e) {}
    await this.exec(`docker run --rm -di --name ${PROJECT}-config-${name} -v ${PROJECT}-${name}:/${PROJECT}-node ${process.env.DOCKER_IMAGE_NODE}:${version} /bin/bash`)
    await this.exec(`docker cp ${PROJECT}-config-${name}:/${PROJECT}-node/default.toml ${configPath}`)
    let config
    try {
      config = fs.readFileSync(configPath, 'utf8')
    } catch (e) {
      return ''
    }
    await this.exec(`docker stop ${PROJECT}-config-${name}`)
    return config
  }

  async writeConfig ({ name, version, content }) {
    const PROJECT = process.env.PROJECT
    const configPath = path.join(os.tmpdir(), 'conflux.toml')
    fs.writeFileSync(configPath, content, 'utf8')
    await this.exec(`docker run --rm -di --name ${PROJECT}-config-${name} -v ${PROJECT}-${name}:/${PROJECT}-node ${process.env.DOCKER_IMAGE_NODE}:${version} /bin/bash`)
    await this.exec(`docker cp ${configPath} ${PROJECT}-config-${name}:/${PROJECT}-node/default.toml`)
    await this.exec(`docker stop ${PROJECT}-config-${name}`)
  }

  async delete (name) {
    await this.exec(`docker volume rm ${process.env.PROJECT}-${name}`)
  }
}

module.exports = InstanceManager