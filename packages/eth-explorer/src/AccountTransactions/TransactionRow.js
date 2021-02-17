import React, { PureComponent } from 'react'

import { Badge } from '@obsidians/ui-components'
import { utils } from '@obsidians/sdk'

import moment from 'moment'

import TransactionFee from './TransactionFee'
import Address from './Address'

export default class TransactionRow extends PureComponent {
  onClick = () => {

  }

  render () {
    const { tx, owner } = this.props

    const amount = `${utils.unit.fromValue(tx.value)} ${process.env.TOKEN_SYMBOL}`

    return (
      <tr onClick={this.onClick}>
        <td><small>{moment(tx.timeStamp * 1000).format('MM/DD HH:mm:ss')}</small></td>
        <td><small>{tx.blockNumber}</small></td>
        <td>
          <div className='flex-1 overflow-hidden'>
            <Address addr={tx.hash} redirect={false}/>
          </div>
        </td>
        <td>
          <Address addr={tx.from} showTooltip={false}/>
        </td>
        <td>
          {
            tx.contractAddress
              ? <>
                  <Badge color='success' className='mr-1'>contract creation</Badge>
                  <Address addr={tx.contractAddress} showTooltip={false}/>
                </>
              : <Address addr={tx.to} showTooltip={false}/>
          }
        </td>
        <td align='right'>
          <Badge pill color={tx.from?.toLowerCase() === owner.toLowerCase() ? 'danger' : 'success'}>
            {amount}
          </Badge>
        </td>
        <td align='right'>
          <Badge pill>{new Intl.NumberFormat().format(tx.gasUsed)}</Badge>
        </td>
        <td align='right'>
          <TransactionFee value={(BigInt(tx.gasPrice) * BigInt(tx.gasUsed)).toString()}/>
        </td>
      </tr>
    )
  }
}
