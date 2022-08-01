import React, { PureComponent } from 'react'

import {
  TableCard,
  Badge,
  Modal,
} from '@obsidians/ui-components'

import { networkManager } from '@obsidians/eth-network'
import { t } from '@obsidians/i18n'

import TransactionRow from './TransactionRow'
import fileOps from '@obsidians/file-ops'
import { TransactionDetails } from '@obsidians/eth-queue'

export default class AccountTransactions extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      hasMore: true,
      loading: true,
      txs: [],
      page: 0,
      total: -1,
      size: 10,
      hide: false,
      error: '',
      explorerUrl: '',
      tx: null,
    }

    this.txModal = React.createRef()
  }

  componentDidMount () {
    this.refresh(this.props.account)
  }

  componentDidUpdate (prevProps) {
    if (prevProps.account !== this.props.account) {
      this.refresh(this.props.account)
    }
  }

  refresh = async account => {
    this.setState({ txs: [], loading: true, page: 0, error: '' })
    const { total, list: txs, noExplorer } = await networkManager.sdk.getTransactions(account.address, 0, this.state.size)
    if (noExplorer) {
      this.setState({ hide: true })
      return
    }
    if (Array.isArray(txs)) {
      this.setState({
        txs,
        total,
        page: 1,
        hasMore: total ? txs.length < total : txs.length === this.state.size,
      })
    } else {
      this.setState({ error: txs })
    }
    this.setState({ loading: false })
  }

  loadMore = async () => {
    this.setState({ loading: true, error: '' })
    const { total, list: txs, noExplorer } = await networkManager.sdk.getTransactions(this.props.account.address, this.state.page, this.state.size)
    if (noExplorer) {
      this.setState({ hide: true })
      return
    }
    if (Array.isArray(txs)) {
      this.setState({
        txs: [...this.state.txs, ...txs],
        total,
        page: this.state.page + 1,
        hasMore: total ? (this.state.txs.length + txs.length) < total : txs.length === this.state.size,
      })
    } else {
      this.setState({ error: txs })
    }
    this.setState({ loading: false })
  }

  renderTableBody = () => {
    const networkId = networkManager.sdk?.txManager?.client?.networkId
    const explorerUrl = networkManager.networks.find(item => networkId === item.id)?.explorerUrl
    const { TransactionRow } = this.props
    this.setState({ explorerUrl })
    const rows = this.state.txs.map(tx => (
      <TransactionRow key={`tx-${tx.hash}`} tx={tx} getTransferDetails={this.getTransferDetails} explorerUrl={explorerUrl} owner={this.props.account.address} />
    ))

    if (this.state.loading) {
      rows.push(
        <tr key='txs-loading' className='bg-transparent'>
          <td align='middle' colSpan={8}>
            <i className='fas fa-pulse fa-spinner mr-1' />{t('loading')}...
          </td>
        </tr>
      )
    } else if (this.state.error) {
      rows.push(
        <tr key='txs-loadmore' className='bg-transparent'>
          <td align='middle' colSpan={8}>
            {this.state.error}
          </td>
        </tr>
      )
    } else if (!this.state.txs.length) {
      rows.push(
        <tr key='txs-loadmore' className='bg-transparent'>
          <td align='middle' colSpan={8}>
            {t('explorer.transactions.noTransactions')}
          </td>
        </tr>
      )
    } else if (this.state.hasMore) {
      rows.push(
        <tr key='txs-loadmore' className='bg-transparent'>
          <td align='middle' colSpan={8}>
            <span className='btn btn-sm btn-secondary' onClick={this.loadMore}>{t('explorer.transactions.loadMore')}</span>
          </td>
        </tr>
      )
    }

    return rows
  }

  getTransferDetails = async tx => {
    const divisor = Math.pow(10, 18)
    const parameters = {obj: {hash: {type: 'bytes32', value: tx.hash}}}
    let result = null
    let resultReceipt = null
    try {
      result = await networkManager.sdk.callRpc('eth_getTransactionByHash', parameters)
      resultReceipt = await networkManager.sdk.callRpc('eth_getTransactionReceipt', parameters)
      result = {
        ...result,
        data: result?.input,
        gasLimit: tx.gas,
        gasPrice: tx.gasPrice,
        maxFeePerGas: result?.maxFeePerGas && parseInt(result.maxFeePerGas, 16),
        maxPriorityFeePerGas: result?.maxPriorityFeePerGas && parseInt(result.maxPriorityFeePerGas, 16),
        nonce: tx.nonce || result?.nonce && parseInt(result.nonce, 16),
      }
      resultReceipt = {
        ...resultReceipt,
        blockNumber: tx.blockNumber || parseInt(resultReceipt?.blockNumber || 0, 16),
        cumulativeGasUsed: tx.cumulativeGasUsed || resultReceipt?.cumulativeGasUsed && parseInt(resultReceipt?.cumulativeGasUsed, 16),
        effectiveGasPrice: {type: 'BigNumber', hex: resultReceipt?.effectiveGasPrice},
        gasUsed: tx?.gasUsed || parseInt(resultReceipt?.gasUsed || 0, 16),
        status: resultReceipt?.status && parseInt(resultReceipt?.status, 16),
        type: resultReceipt?.type && parseInt(resultReceipt?.type, 16),
        l1GasPrice: resultReceipt?.l1GasPrice && parseInt(resultReceipt?.l1GasPrice, 16),
        l1GasUsed: resultReceipt?.l1GasUsed && parseInt(resultReceipt?.l1GasUsed, 16),
      }
      let transactionFee = (tx?.gasPrice * resultReceipt?.gasUsed) / divisor || 0
      if (resultReceipt?.l1Fee) transactionFee += parseInt(resultReceipt?.l1Fee, 16) / divisor || 0
      resultReceipt.transactionFee = transactionFee
    } catch (error) {
      console.warn(error)
    }

    tx.ts = tx.timeStamp
    tx.status = resultReceipt?.status ? (resultReceipt?.status === 1? 'SUCCESS' : 'FAILED') : ''
    tx.txHash = tx.hash
    tx.data = {
      value: { type: 'BigNumber', hex: result?.value || '0x0'},
      transaction: result,
      receipt: resultReceipt,
      signer: tx.from,
      params: {
        from: tx.from,
        to: tx.to,
        amount: (tx.value / divisor)
      }
    }
    await this.setState({ tx })
    this.txModal.current.openModal()
  }

  openBlockExplorer = () => {
    const { explorerUrl, tx } = this.state
    explorerUrl && fileOps.current.openLink(`${explorerUrl}/tx/${tx.hash}`)
  }

  render () {
    const TransactionHeader = this.props.TransactionHeader
    if (this.state.hide) {
      return null
    }
    const total = Math.max(0, this.state.total) || ''
    return (
    <>
      <TableCard
        title={
          <div className='d-flex flex-row align-items-end'>
            <h4 className='mb-0'>{t('explorer.transactions.transactions')}</h4>
            <Badge pill className='ml-1 mb-1'>{total}</Badge>
          </div>
        }
        tableSm
        TableHead={<TransactionHeader />}
      >
        {this.renderTableBody()}
      </TableCard>
      <Modal
        ref={this.txModal}
        title={'Transaction Detail'}
        textCancel='Close'
        textConfirm={'View More on Block Explorer'}
        onConfirm={this.openBlockExplorer}
      >
        <TransactionDetails
          tx={this.state.tx}
          explorerUrl={this.state.explorerUrl}
          transferType={'generalTransfer'}
          closeModal={() => this.txModal.current.closeModal()}
        />
      </Modal>
    </>
    )
  }
}

const TransactionHeader = () => (
  <tr>
    <th style={{ width: '10%' }}>{t('explorer.transactions.time')}</th>
    <th style={{ width: '8%' }}>{t('explorer.transactions.block')}</th>
    <th style={{ width: '17%' }}>{t('explorer.transactions.txHash')}</th>
    <th style={{ width: '17%' }}>{t('explorer.transactions.from')}</th>
    <th style={{ width: '17%' }}>{t('explorer.transactions.to')}</th>
    <th style={{ width: '8%', textAlign: 'right' }}>{t('explorer.transactions.value')}</th>
    <th style={{ width: '8%', textAlign: 'right' }}>{t('explorer.transactions.gasUsed')}</th>
    <th style={{ width: '15%', textAlign: 'right' }}>{t('explorer.transactions.fee')}</th>
  </tr>
)

AccountTransactions.defaultProps = {
  TransactionHeader,
  TransactionRow,
}