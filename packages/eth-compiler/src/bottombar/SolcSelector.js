import React from 'react'

import platform from '@obsidians/platform'
import { DropdownItem } from '@obsidians/ui-components'

import notification from '@obsidians/notification'
import { DockerImageSelector } from '@obsidians/docker'
import { BaseProjectManager } from '@obsidians/workspace'
import { t } from '@obsidians/i18n'
import compilerManager from '../compilerManager'

let n

export default () => {
  const [selected, onSelected] = React.useState('')

  React.useEffect(BaseProjectManager.effect('settings:compilers.solc', v => {
    if (platform.isDesktop) {
      n?.dismiss()
      if (v === 'default') {
        n = notification.info(t('compiler.solc.defaultSelect'), t('compiler.solc.defaultSelectMessage'), 4)
      } else if (v) {
        n = notification.info(t('compiler.solc.selected', { version: v }), t('compiler.solc.selectedMessage'), 4)
      }
    }
    onSelected(v)
  }), [])

  return (
    <DockerImageSelector
      channel={compilerManager.solc}
      disableAutoSelection
      size='sm'
      icon='fas fa-hammer'
      title={t('compiler.solc.title')}
      noneName={t('compiler.solc.noneName')}
      modalTitle={t('compiler.solc.manager')}
      downloadingTitle={t('compiler.solc.downloading')}
      selected={selected}
      onSelected={v => BaseProjectManager.instance.projectSettings?.set('compilers.solc', v)}
    >
      {
        platform.isDesktop
        ? <>
            <DropdownItem
              active={selected === 'default'}
              onClick={() => BaseProjectManager.instance.projectSettings?.set('compilers.solc', 'default')}
            >
              {t('compiler.solc.default')}
            </DropdownItem>
            <DropdownItem divider />
          </>
        : null
      }

    </DockerImageSelector>
  )
}