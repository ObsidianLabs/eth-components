import notification from '@obsidians/notification'
import { BaseQueueManager } from '@obsidians/queue'
import { utils } from '@obsidians/sdk'

class Queue extends BaseQueueManager {
  async process (pendingTransaction, txHash, data, callbacks) {
    this.updateStatus(txHash, 'PUSHING', data, callbacks)
    if (data.contractName) {
      notification.info(`Deploying...`, `Deploying contract <b>${data.contractName}</b>...`)
    } else {
      notification.info(`Pushing transaction...`, `Transaction hash <b>${txHash}</b>...`)
    }

    let tx
    try {
      tx = await pendingTransaction.mined()
    } catch (e) {
      console.warn(e)
      this.updateStatus(txHash, 'FAILED-TIMEOUT', { error: { message: e.message } }, callbacks)
      notification.error('Transaction Timeout', e.message)
      return
    }
    if (tx && tx.error) {
      notification.error('Transaction Failed', tx.error)

      this.updateStatus(txHash, 'FAILED', {
        tx: tx.tx,
        receipt: tx.receipt,
        error: { code: tx.code, message: tx.error }
      }, callbacks)
      return
    }
    this.updateStatus(txHash, 'MINED', { tx }, callbacks)

    let receipt
    try {
      receipt = await pendingTransaction.executed()
    } catch (e) {
      console.warn(e)
      notification.error('Transaction Failed', e.message)
      this.updateStatus(txHash, 'FAILED', { error: { error: e.message } }, callbacks)
      return
    }
    if (receipt && !receipt.status) {
      this.updateStatus(txHash, 'FAILED', { receipt }, callbacks)
      return
    } else if (receipt?.outcomeStatus) {
      pendingTransaction.cfx.call(tx, tx.epochHeight - 1).catch(err => {
        const decodedMessage = utils.decodeError(err.data.replace(/\"/g, ''))
        notification.error('Transaction Failed', decodedMessage)

        this.updateStatus(txHash, 'FAILED', { receipt, error: {
          code: err.code,
          message: err.message,
          data: decodedMessage,
        } }, callbacks)
      })

      return
    } else if (receipt.gasUsed) {
      const gasUsed = receipt.gasUsed.toString()
      // const gasFee = receipt.gasFee.toString()
      notification.info('Transaction Executed', `Gas used ${gasUsed}.`)
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
    notification.success('Transaction Confirmed', result?.message || '')
    this.updateStatus(txHash, 'CONFIRMED', { confirmed: result?.message }, callbacks)
  }
}

export default new Queue()