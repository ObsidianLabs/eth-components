import React, { PureComponent } from 'react'

import notification from '@obsidians/notification'
import { AbiActionForm } from '@obsidians/eth-contract'
import { t } from '@obsidians/i18n'

import networkManager from '../networkManager'

export default class RpcActionForm extends PureComponent {
  executeAction = async (method, abiForm) => {
    if (abiForm.state.executing) {
      return
    }

    if (!networkManager.sdk) {
      notification.error(t('network.network.fail'), t('network.network.noNetworkText'))
      return
    }

    let parameters = { array: [], obj: {} }
    try {
      parameters = abiForm.form.current.getParameters()
    } catch (e) {
      notification.error(t('network.network.errorParameters'), e.message)
      return
    }

    abiForm.setState({ executing: true, actionError: '', actionResult: '' })

    let result
    try {
      result = await networkManager.sdk.callRpc(method, parameters)
    } catch (e) {
      console.warn(e)
      abiForm.setState({ executing: false, actionError: e.message, actionResult: '' })
      return
    }

    abiForm.setState({
      executing: false,
      actionError: '',
      actionResult: JSON.stringify(result, null, 2),
    })
  }

  render () {
    return (
      <AbiActionForm
        toolbarId='execute-rpc-method'
        FormSection={AbiActionForm.FormSection}
        inModal
        smDropdown
        selectorHeader={null}
        selectorIcon='fas fa-exchange-alt'
        noGasOptions
        showResult
        noResultBadge
        actions={networkManager.sdk?.rpc.methods || []}
        executeAction={this.executeAction}
      />
    )
  }
}
