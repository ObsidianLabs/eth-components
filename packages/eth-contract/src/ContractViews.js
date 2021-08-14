import React from 'react'

import {
  ButtonOptions,
} from '@obsidians/ui-components'

import { withRouter } from 'react-router-dom'
import notification from '@obsidians/notification'
import keypairManager from '@obsidians/keypair'
import ReactJson from 'react-json-view'

import AbiActionForm from './components/AbiActionForm'

export default class ContractViews extends AbiActionForm {
  static defaultProps = {
    toolbarId: 'contract-execute-view',
    FormSection: AbiActionForm.MarginlessFormSection,
    selectorHeader: 'view functions',
    selectorIcon: 'far fa-eye',
    noGasOptions: true,
    showResult: true,
  }

  executeAction = async actionName => {
    if (this.state.executing) {
      return
    }

    let parameters = { array: [], obj: {} }
    try {
      parameters = this.form.current.getParameters()
    } catch (e) {
      notification.error('Error in Parameters', e.message)
      return
    }

    this.setState({ executing: true, actionError: '', actionResult: null })

    let result
    try {
      result = await this.props.contract.query(actionName, parameters, {
        from: this.state.signer
      })
    } catch (e) {
      console.warn(e)
      this.setState({ executing: false, actionError: e.message, actionResult: null })
      return
    }

    this.setState({
      executing: false,
      actionError: '',
      actionResult: result,
    })
  }

  renderResultContent = () => <ResultContent {...this.state} />
}

const ResultContent = withRouter(({ actionError, actionResult, history }) => {
  const [format, setFormat] = React.useState('pretty')
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
    return <>
      <div>
        <ButtonOptions
          size='sm'
          options={[{ key: 'pretty', text: 'Pretty' }, { key: 'raw', text: 'Raw' }]}
          selected={format}
          onSelect={setFormat}
        />
      </div>
      {
        format === 'pretty'
        ? <ReactJson
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
        : <pre className='text-body pre-wrap break-all small user-select'>{actionResult.raw}</pre>
      }
    </>
  }

  return <div className='small'>(None)</div>
})
