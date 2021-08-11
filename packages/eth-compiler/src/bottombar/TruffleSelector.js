import React from 'react'

import { DockerImageSelector } from '@obsidians/docker'
import { BaseProjectManager } from '@obsidians/workspace'
import compilerManager from '../compilerManager'

export default () => {
  const [framework, setFramework] = React.useState('')
  const [selected, onSelected] = React.useState('')

  React.useEffect(BaseProjectManager.effect(`settings:framework`, setFramework), [])
  React.useEffect(BaseProjectManager.effect(`settings:compilers.${process.env.COMPILER_VERSION_KEY}`, onSelected), [])

  if (framework !== 'truffle') {
    return null
  }

  return (
    <DockerImageSelector
      channel={compilerManager.truffle}
      disableAutoSelection
      size='sm'
      icon='fas fa-cookie'
      title={`${process.env.COMPILER_NAME}`}
      noneName={`${process.env.COMPILER_NAME}`}
      modalTitle={`${process.env.COMPILER_NAME} Manager`}
      downloadingTitle={`Downloading ${process.env.COMPILER_NAME}`}
      selected={selected}
      onSelected={v => BaseProjectManager.instance.projectSettings?.set(`compilers.${process.env.COMPILER_VERSION_KEY}`, v)}
    />
  )
}