import { instanceChannel } from '@obsidians/eth-network'
import compiler from '@obsidians/eth-compiler'
import { dockerChannel } from '@obsidians/docker'

export default async function checkDependencies () {
  try {
    const results = await Promise.all([
      dockerChannel.check(),
      instanceChannel.node.installed(),
      compiler.truffle.installed(),
    ])
    return results.every(x => !!x)
  } catch (e) {
    return false
  }
}