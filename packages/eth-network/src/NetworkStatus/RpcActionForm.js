import notification from '@obsidians/notification'
import { AbiActionForm } from '@obsidians/eth-contract'
import { rpc } from '@obsidians/sdk'

import networkManager from '../networkManager'

export default class RpcActionForm extends AbiActionForm {
  static defaultProps = {
    toolbarId: 'execute-rpc-method',
    FormSection: AbiActionForm.FormSection,
    inModal: true,
    smDropdown: true,
    actions: rpc.methods,
    selectorHeader: '',
    selectorIcon: 'fas fa-exchange-alt',
    showResult: true,
  }

  executeAction = async method => {
    if (this.state.executing) {
      return
    }

    if (!networkManager.sdk) {
      notification.error('Call RPC Failed', 'No running node. Please start one first.')
      return
    }

    let parameters = { array: [], obj: {} }
    try {
      parameters = this.form.current.getParameters()
    } catch (e) {
      notification.error('Error in Parameters', e.message)
      return
    }

    this.setState({ executing: true, actionError: '', actionResult: '' })

    let result
    try {
      result = await networkManager.sdk.callRpc(method, parameters)
    } catch (e) {
      console.warn(e)
      this.setState({ executing: false, actionError: e.message, actionResult: '' })
      return
    }

    this.setState({
      executing: false,
      actionError: '',
      actionResult: JSON.stringify(result, null, 2),
    })
  }
}
