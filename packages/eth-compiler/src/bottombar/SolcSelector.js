import React from 'react'

import { DropdownItem } from '@obsidians/ui-components'

import notification from '@obsidians/notification'
import { DockerImageSelector } from '@obsidians/docker'
import { BaseProjectManager } from '@obsidians/workspace'
import compilerManager from '../compilerManager'

let n

export default props => {
  const [hasDefault, setHasDefault] = React.useState(!props.remote)
  const [selected, onSelected] = React.useState('')

  React.useEffect(BaseProjectManager.effect(`settings:framework`, framework => {
    if (props.remote) {
      setHasDefault(false)
      return
    }
    setHasDefault(framework === 'truffle')
  }), [])
  
  React.useEffect(BaseProjectManager.effect('settings:compilers.solc', v => {
    if (!props.remote) {
      if (v === 'default') {
        n = notification.info('Solc from truffle-config.js Selected', 'The version of solc used in compilation will be determined by <b>truffle-config.js</b>.', 4)
      } else if (v) {
        n = notification.info(`Solc v${v} Selected`, `This will overwrite the configuration of <b>truffle-config.js</b> in compilation.`, 4)
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
      title='Solc'
      noManager
      selected={selected}
      selectedText={selected === 'default' ? 'truffle-config.js' : undefined}
      onSelected={v => BaseProjectManager.instance.projectSettings?.set('compilers.solc', v)}
    >
      {
        hasDefault &&
        <>
          <DropdownItem
            active={selected === 'default'}
            onClick={() => BaseProjectManager.instance.projectSettings?.set('compilers.solc', 'default')}
          >
            From truffle-config.js
          </DropdownItem>
          <DropdownItem divider />
        </>
      }
      
    </DockerImageSelector>
  )
}