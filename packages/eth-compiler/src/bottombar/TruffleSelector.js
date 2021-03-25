import React from 'react'

import { DockerImageSelector } from '@obsidians/docker'
import { BaseProjectManager } from '@obsidians/workspace'
import { t } from '@obsidians/i18n'
import compilerManager from '../compilerManager'

export default () => {
  const [selected, onSelected] = React.useState('')

  React.useEffect(BaseProjectManager.effect(`settings:compilers.${process.env.COMPILER_VERSION_KEY}`, onSelected), [])

  return (
    <DockerImageSelector
      channel={compilerManager.truffle}
      disableAutoSelection
      size='sm'
      icon='fas fa-cookie'
      title={`${process.env.COMPILER_NAME}`}
      noneName={`${process.env.COMPILER_NAME}`}
      modalTitle={t('compiler.truffle.manager', { compiler: process.env.COMPILER_NAME })}
      downloadingTitle={t('compiler.truffle.downloading', { compiler: process.env.COMPILER_NAME })}
      selected={selected}
      onSelected={v => BaseProjectManager.instance.projectSettings?.set(`compilers.${process.env.COMPILER_VERSION_KEY}`, v)}
    />
  )
}