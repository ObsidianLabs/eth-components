import { networkManager, instanceChannel } from '@obsidians/eth-network'
import notification from '@obsidians/notification'

import { getCachingKeys, dropByCacheKey } from 'react-router-cache-route'

class NodeManager {
  constructor () {
    this._sdk = null
    this._terminal = null
    this._minerTerminal = null
    this._indexerTerminal = null
    this._configModal = null
    this.network = null
  }

  get sdk () {
    return this._sdk
  }

  set terminal (v) {
    this._terminal = v
  }

  set minerTerminal (v) {
    this._minerTerminal = v
  }

  set indexerTerminal (v) {
    this._indexerTerminal = v
  }

  set configModal (v) {
    this._configModal = v
  }

  set status (v) {
    this._status = v
  }

  async start ({ name, version }) {
    if (!this._terminal) {
      throw new Error()
    }

    const versions = await instanceChannel.node.versions()
    if (!versions.find(v => v.Tag === version)) {
      notification.error(`${process.env.CHAIN_EXECUTABLE_NAME} ${version} not Installed`, `Please install the version in <b>${process.env.CHAIN_EXECUTABLE_NAME} Version Manager</b>`)
      throw new Error('Version not installed')
    }

    return await this.execStart({ name, version })
  }

  async execStart ({ name, version }) {
    const startDocker = this.generateCommand({ name, version })
    await this._terminal.exec(startDocker, {
      resolveOnFirstLog: true,
      stopCommand: `docker stop ${process.env.PROJECT}-${name}-${version}`,
    })
    return { id: `dev.${name}`, version }
  }

  generateCommand ({ name, version }) {
    const containerName = `${process.env.PROJECT}-${name}-${version}`

    return [
      'docker run -it --rm',
      `--name ${containerName}`,
      `-p 8545:8545`,
      `-v ${process.env.PROJECT}-${name}:/data`,
      `-w /data`,
      `${process.env.DOCKER_IMAGE_NODE}:${version}`,
      `--datadir=/data --dev --dev.period=1 --nousb --http --http.addr=0.0.0.0 --http.corsdomain="*" --password=pwd`
    ].join(' ')
  }
  async updateLifecycle (lifecycle, params) {
    if (this._status) {
      this._status.setState({ lifecycle })
    }
    if (lifecycle === 'started') {
      await networkManager.updateSdk(params)
    } else if (lifecycle === 'stopping') {
      networkManager.disposeSdk()
    }
  }

  updateBlockNumber (blockNumber) {
    if (this._status) {
      this._status.setState({ blockNumber })
    }
  }

  async stop () {
    const cachingKeys = getCachingKeys()
    cachingKeys.filter(key => key.startsWith('contract-') || key.startsWith('account-')).forEach(dropByCacheKey)
    if (this._terminal) {
      const n = notification.info(`Stopping ${process.env.CHAIN_EXECUTABLE_NAME}...`, '', 0)
      await this._terminal.stop()
      n.dismiss()
    }
  }
}

export default new NodeManager()