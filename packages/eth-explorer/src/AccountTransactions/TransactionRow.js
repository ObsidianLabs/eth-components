import React, { PureComponent } from 'react'

import { Badge } from '@obsidians/ui-components'
import { networkManager } from '@obsidians/eth-network'

import moment from 'moment'

import TransactionFee from './TransactionFee'
import Address from './Address'
import fileOps from '@obsidians/file-ops'

export default class TransactionRow extends PureComponent {
  onClick = e => {
    e.stopPropagation()
    const { tx, explorerUrl } = this.props
    explorerUrl && tx.hash && fileOps.current.openLink(`${explorerUrl}/tx/${tx.hash}`)
  }

  openTransferDetails = () => this.props.getTransferDetails(this.props.tx)

  render () {
    const { tx, owner, explorerUrl } = this.props

    const amount = new Intl.NumberFormat().format(networkManager.sdk?.utils.unit.fromValue(tx.value))
    const gasUsed = tx.gasUsed ? new Intl.NumberFormat().format(tx.gasUsed) : ''
    const gasFee = tx.gasFee || (BigInt(tx.gasPrice || 0) * BigInt(tx.gasUsed || 0))

    return (
      <tr onClick={this.onClick} className={explorerUrl && 'cursor-pointer'}>
        <td><small>{moment(tx.timeStamp * 1000).format('MM/DD HH:mm:ss')}</small></td>
        <td><small>{tx.blockNumber}</small></td>
        <td>
          <div className='flex-1 overflow-hidden'>
            <Address addr={tx.hash} showTooltip={false} isOpenDetailsModal={true} openTransferDetails={this.openTransferDetails}/>
          </div>
        </td>
        <td>
          <Address addr={tx.from} showTooltip={false}/>
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
        <td align='right'>
          <Badge pill color={tx.value === '0' ? 'secondary' : tx.from === owner ? 'danger' : 'success'}>
            {amount} {networkManager.symbol}
          </Badge>
        </td>
        <td align='right'>
          <Badge pill>{gasUsed}</Badge>
        </td>
        <td align='right'>
          <TransactionFee value={gasFee}/>
        </td>
      </tr>
    )
  }
}
