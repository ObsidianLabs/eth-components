import notification from '@obsidians/notification'
import { txOptions, utils } from '@obsidians/sdk'
import queue from '@obsidians/eth-queue'
import { networkManager } from '@obsidians/eth-network'

import AbiActionForm from './components/AbiActionForm'

export default class ContractActions extends AbiActionForm {
  static defaultProps = {
    FormSection: AbiActionForm.MarginlessFormSection,
    selectorHeader: 'write functions',
    selectorIcon: 'fas fa-function',
    signerSelector: true,
    txOptions,
  }

  estimate = async actionName => {
    if (!this.state.signer) {
      notification.error('Error', 'No signer is provided. Please make sure you have availabe keypairs to use in the keypair manager.')
      return
    }

    let parameters = { array: [], obj: {} }
    try {
      parameters = this.form.current.getParameters()
    } catch (e) {
      notification.error('Error in Parameters', e.message)
      return
    }

    let result
    try {
      const value = utils.unit.toValue(this.state.amount || '0')
      const tx = await this.props.contract.execute(actionName, parameters, {
        from: this.state.signer,
        value,
      })
      result = await networkManager.sdk.estimate(tx)
    } catch (e) {
      notification.error('Estimate Error', e.message)
      return
    }

    if (result) {
      this.setState(result)
    }
  }

  executeAction = async actionName => {
    if (this.state.executing) {
      return
    }

    if (!this.state.signer) {
      notification.error('Error', 'No signer is provided. Please make sure you have availabe keypairs to use in the keypair manager.')
      return
    }

    let parameters = { array: [], obj: {} }
    try {
      parameters = this.form.current.getParameters()
    } catch (e) {
      notification.error('Error in Parameters', e.message)
      return
    }

    if (parameters.empty && parameters.array.length && !this.confirming) {
      this.confirming = true
      setTimeout(() => { this.confirming = false }, 3000)
      notification.info('Send transaction with empty parameters?', 'Press the execute button again to confirm.', 3)
      return
    }

    this.setState({ executing: true, actionError: '', actionResult: '' })

    const signer = this.state.signer

    const options = {}
    txOptions.list && txOptions.list.forEach(opt => options[opt.name] = this.state[opt.name] || opt.default)

    let result = {}
    try {
      const value = utils.unit.toValue(this.state.amount || '0')
      const tx = await this.props.contract.execute(actionName, parameters, {
        from: signer,
        value,
        ...options,
      })
      await queue.add(
        () => networkManager.sdk.sendTransaction(tx),
        {
          contractAddress: this.props.contract.address,
          name: actionName,
          functionName: actionName,
          signer,
          params: parameters.obj,
          value,
          ...options,
        }
      )
    } catch (e) {
      console.warn(e)
      if (e.data) {
        notification.error('Error', `${e.message}<br />${e.data}`)
      } else {
        notification.error('Error', e.message)
      }
      this.setState({ executing: false, actionError: e.message, actionResult: '' })
      return
    }

    // notification.success('Success', 'Transaction is confirmed.')
    this.setState({
      executing: false,
      actionError: '',
      actionResult: JSON.stringify(result, null, 2)
    })
  }
}
