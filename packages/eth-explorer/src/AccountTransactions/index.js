import React, { PureComponent } from 'react'

import {
  TableCard,
} from '@obsidians/ui-components'

import { networkManager } from '@obsidians/eth-network'

import TransactionRow from './TransactionRow'

export default class AccountTransactions extends PureComponent {
  state = {
    hasMore: true,
    loading: true,
    txs: [],
    page: 0,
    total: -1,
    size: 10,
    hide: false
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
    this.setState({ txs: [], loading: true, page: 0 })
    const { total, list: txs, noExplorer } = await networkManager.sdk.getTransactions(account.address, 0, this.state.size)
    if (noExplorer) {
      this.setState({ hide: true })
      return
    }
    this.setState({
      txs,
      page: 1,
      hasMore: total ? txs.length < total : txs.length === this.state.size,
      loading: false
    })
  }

  loadMore = async () => {
    this.setState({ loading: true })
    const { total, list: txs, noExplorer } = await networkManager.sdk.getTransactions(this.props.account.address, this.state.page, this.state.size)
    if (noExplorer) {
      this.setState({ hide: true })
      return
    }
    this.setState({
      txs: [...this.state.txs, ...txs],
      page: this.state.page + 1,
      hasMore: total ? (this.state.txs.length + txs.length) < total : txs.length === this.state.size,
      loading: false,
    })
  }

  renderTableBody = () => {
    const TransactionRow = this.props.TransactionRow
    const rows = this.state.txs.map(tx => (
      <TransactionRow key={`tx-${tx.hash}`} tx={tx} owner={this.props.account.address} />
    ))

    if (this.state.loading) {
      rows.push(
        <tr key='txs-loading' className='bg-transparent'>
          <td align='middle' colSpan={8}>
            <i className='fas fa-spin fa-spinner mr-1' />Loading...
          </td>
        </tr>
      )
    } else if (!this.state.txs.length) {
      rows.push(
        <tr key='txs-loadmore' className='bg-transparent'>
          <td align='middle' colSpan={8}>
            No Transactions Found
          </td>
        </tr>
      )
    } else if (this.state.hasMore) {
      rows.push(
        <tr key='txs-loadmore' className='bg-transparent'>
          <td align='middle' colSpan={8}>
            <span className='btn btn-sm btn-secondary' onClick={this.loadMore}>Load More</span>
          </td>
        </tr>
      )
    }

    return rows
  }


  render () {
    if (this.state.hide) {
      return null
    }
    return (
      <TableCard
        title='Transactions'
        tableSm
        TableHead={(
          <tr>
            <th style={{ width: '10%' }}>time</th>
            <th style={{ width: '8%' }}>block</th>
            <th style={{ width: '17%' }}>tx hash</th>
            <th style={{ width: '17%' }}>from</th>
            <th style={{ width: '17%' }}>to</th>
            <th style={{ width: '8%', textAlign: 'right' }}>value</th>
            <th style={{ width: '8%', textAlign: 'right' }}>gas used</th>
            <th style={{ width: '15%', textAlign: 'right' }}>fee</th>
          </tr>
        )}
      >
        {this.renderTableBody()}
      </TableCard>
    )
  }
}

AccountTransactions.defaultProps = {
  TransactionRow,
}