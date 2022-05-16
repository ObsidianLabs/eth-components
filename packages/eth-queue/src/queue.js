import notification from '@obsidians/notification'
import { BaseQueueManager } from '@obsidians/queue'
import { t } from '@obsidians/i18n'

class Queue extends BaseQueueManager {
  async process (pendingTransaction, txHash, data, callbacks) {
    this.updateStatus(txHash, 'PUSHING', data, callbacks)
    if (data.contractName) {
      notification.info(t('contract.deploy.deploying'), t('contract.deploy.deployingText', {name: data.contractName}))
    } else {
      notification.info(t('contract.deploy.pushTrans'), t('contract.deploy.pushTransText', {txHash}))
    }

    let res
    try {
      res = await pendingTransaction.mined()
    } catch (e) {
      console.warn(e)
      this.updateStatus(txHash, 'FAILED-TIMEOUT', { error: { message: e.message } }, callbacks)
      notification.error(t('contract.deploy.timeout'), e.message)
      return
    }
    if (res && res.error) {
      notification.error(t('contract.deploy.failed'), res.error)

      this.updateStatus(txHash, 'FAILED', {
        tx: res.tx,
        receipt: res.receipt,
        error: { code: res.code, message: res.error }
      }, callbacks)
      return
    }
    this.updateStatus(txHash, 'MINED', res, callbacks)

    let receipt
    try {
      receipt = await pendingTransaction.executed()
    } catch (e) {
      console.warn(e)
      notification.error(t('contract.deploy.failed'), e.message)
      this.updateStatus(txHash, 'FAILED', {
        receipt: e.receipt,
        error: { code: e.code, message: e.message, data: e.data },
      }, callbacks)
      return
    }
    if (receipt.gasUsed) {
      const gasUsed = receipt.gasUsed.toString()
      // const gasFee = receipt.gasFee.toString()
      notification.info(t('contract.deploy.executed'), t('contract.deploy.executedText', {gasUsed}))
      // notification.info('Transaction Executed', `Gas used ${gasUsed}, gas fee ${gasFee}`)
    }
    this.updateStatus(txHash, 'EXECUTED', { receipt }, callbacks)

    let result
    try {
      result = await pendingTransaction.confirmed()
    } catch (e) {
      this.updateStatus(txHash, 'CONFIRMED', {}, callbacks)
      return
    }
    notification.success(t('contract.deploy.confirmed'), result?.message || '')
    this.updateStatus(txHash, 'CONFIRMED', { confirmed: result?.message }, callbacks)
  }
}

export default new Queue()