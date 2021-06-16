import notification from '@obsidians/notification'
import { AbiActionForm } from '@obsidians/eth-contract'

import { rpc } from '@obsidians/sdk'

export default class RpcActionForm extends AbiActionForm {
  static defaultProps = {
    FormSection: AbiActionForm.FormSection,
    inModal: true,
    actions: rpc.methods,
    selectorHeader: 'rpc methods',
    selectorIcon: 'far fa-eye',
    showResult: true,
  }

  executeAction = async actionName => {
    if (this.state.executing) {
      return
    }

    const result = '{}'

    this.setState({
      executing: false,
      actionError: '',
      actionResult: JSON.stringify(result, null, 2),
    })
  }
}
