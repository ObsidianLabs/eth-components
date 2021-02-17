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
      this.updateStatus(txHash, 'FAILED-TIMEOUT', { error: { message: e.message } }, callbacks)
      notification.error('Transaction Timeout', e.message)
      return
    }
    if (tx.error) {
      notification.error('Transaction Failed', tx.error)

      this.updateStatus(txHash, 'FAILED', {
        tx: tx.tx,
        receipt: tx.receipt,
        error: { code: tx.code, message: tx.error }
      }, callbacks)
      return
    }
    this.updateStatus(txHash, 'MINED', { tx }, callbacks)

    const receipt = await pendingTransaction.executed()
    if (receipt.outcomeStatus) {
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
    } else {
      const gasUsed = receipt.gasUsed.toString()
      // const gasFee = receipt.gasFee.toString()
      notification.info('Transaction Executed', `Gas used ${gasUsed}.`)
      // notification.info('Transaction Executed', `Gas used ${gasUsed}, gas fee ${gasFee}`)
    }
    this.updateStatus(txHash, 'EXECUTED', { receipt }, callbacks)

    try {
      await pendingTransaction.confirmed()
    } catch (e) {
      this.updateStatus(txHash, 'CONFIRMED', {}, callbacks)
      return
    }
    notification.success('Transaction Confirmed', '')
    this.updateStatus(txHash, 'CONFIRMED', {}, callbacks)
  }
}

export default new Queue()