import { IpcChannel } from '@obsidians/ipc'
import { DockerImageChannel } from '@obsidians/docker'
import semver from 'semver'

const channel = new IpcChannel('node-instance')

const opts = {
  filter: v => semver.valid(v)
}
if (process.env.DOCKER_IMAGE_NODE_MIN_VERSION) {
  opts.filter = v => semver.valid(v) && semver.gte(v, process.env.DOCKER_IMAGE_NODE_MIN_VERSION)
}

channel.node = new DockerImageChannel(process.env.DOCKER_IMAGE_NODE, opts)

export default channel