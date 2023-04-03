import React, { PureComponent } from 'react'

import { Badge } from '@obsidians/ui-components'
import { networkManager } from '@obsidians/eth-network'

import moment from 'moment'

import TransactionFee from './TransactionFee'
import Address from './Address'

export default class TransactionRow extends PureComponent {
  onClick = () => {

  }

  render() {
    const { tx, owner } = this.props
    const amount = networkManager.sdk?.utils.unit.fromValue(tx.value)
    const gasUsed = tx.gasUsed ? new Intl.NumberFormat().format(tx.gasUsed) : ''
    const gasFee = tx.gasFee || (BigInt(tx.gasPrice || 0) * BigInt(tx.gasUsed || 0))
    const explorer = networkManager.sdk.client.explorer

    return (
      <tr onClick={this.onClick}>
        <td><small>{moment(tx.timeStamp).format('YYYY/MM/DD HH:mm:ss')}</small></td>
        <td><small>{tx.blockNumber}</small></td>
        <td>
          <div className='flex-1 overflow-hidden'>
            <Address href={`${explorer}/tx/${tx.hash}`} addr={tx.hash} redirect={false} />
          </div>
        </td>
        <td>
          <Address addr={tx.from} showTooltip={false} />
        </td>
        <td>
          <Badge color='success' className='mr-1'>{tx.contractAddress && 'contract creation'}</Badge>
          <Address
            addr={tx.contractAddress || tx.to}
            route={tx.contractAddress || tx.method ? 'contract' : 'account'}
            showTooltip={false}
          />
          <Badge color='secondary'>{tx.method}</Badge>
        </td>
        <td align='left'>
          <Badge pill color={tx.value === '0' ? 'secondary' : tx.from === owner ? 'warning' : 'success'}>
            {
              tx.value === '0' ? `${amount} ${networkManager.symbol}` : `${tx.from === owner ? '-' : '+'} ${amount} ${networkManager.symbol}`
            }
          </Badge>
        </td>
        <td align='right'>
          <TransactionFee value={gasFee} />
        </td>
        <td align='right'>
          <Badge pill><span className={tx.txStatus === 0 ? 'text-success' : 'text-danger'}>{tx.txStatus === 0 ? '成功' : '失败'}</span></Badge>
        </td>
      </tr>
    )
  }
}
