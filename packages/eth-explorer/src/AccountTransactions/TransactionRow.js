import React, { PureComponent } from 'react'

import { Badge } from '@obsidians/ui-components'

import moment from 'moment'

import TransactionTransfer from './TransactionTransfer'
import TransactionFee from './TransactionFee'
import Address from './Address'

export default class TransactionRow extends PureComponent {
  onClick = () => {

  }

  render () {
    const { tx, owner } = this.props
    let TxComponent = <TransactionTransfer tx={tx} owner={owner} />
    return (
      <tr onClick={this.onClick}>
        <td><small>{moment(tx.timestamp * 1000).format('MM/DD HH:mm:ss')}</small></td>
        <td>
          <div className='flex-1 overflow-hidden'>
            <Address addr={tx.hash} redirect={false}/>
          </div>
        </td>
        <td>{TxComponent}</td>
        <td>
          <TransactionFee value={tx.gasFee}/>
        </td>
        <td>
          <TransactionFee value={tx.gasPrice}/>
        </td>
      </tr>
    )
  }
}
