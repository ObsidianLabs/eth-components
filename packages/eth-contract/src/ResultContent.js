import React from 'react'

import notification from '@obsidians/notification'
import keypairManager from '@obsidians/keypair'

import { withRouter } from 'react-router-dom'
import ReactJson from 'react-json-view'
import Highlight from 'react-highlight'

export default withRouter(({ format, actionError, actionResult, history }) => {
  const [keypairs, setKeypairs] = React.useState({})

  const updateKeypairs = keyList => {
    const keypairs = {}
    keyList.forEach(k => keypairs[k.address] = k.name)
    setKeypairs(keypairs)
  }

  React.useEffect(() => {
    keypairManager.loadAllKeypairs().then(updateKeypairs)
    return keypairManager.onUpdated(updateKeypairs)
  }, [])

  if (actionError) {
    return <div><span>{actionError}</span></div>
  }

  if (actionResult) {
    if (format === 'pretty') {
      return (
        <ReactJson
          src={actionResult.parsed}
          theme='monokai'
          indentWidth={2}
          name={false}
          quotesOnKeys={false}
          displayArrayKey={false}
          enableClipboard={() => notification.info('Copied to Clipboard')}
          getLabel={addr => keypairs[addr.toLowerCase()]}
          onRedirect={link => history.push(link)}
        />
      )
    } else {
      return (
        <Highlight language='javascript' className='pre-wrap break-all small' element='pre'>
          <code>{JSON.stringify(actionResult.raw, null, 2)}</code>
        </Highlight>
      )
    }
  }

  return <div className='small'>(None)</div>
})
