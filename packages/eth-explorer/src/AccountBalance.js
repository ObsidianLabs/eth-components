import React, { PureComponent } from 'react'

import {
  TableCard,
  TableCardRow,
} from '@obsidians/ui-components'

export default class AccountBalance extends PureComponent {
  render () {
    const { account } = this.props

    return (
      <TableCard title='Account'>
        <TableCardRow
          name='Balance'
          icon='far fa-coins'
          badge={`${account.balance} ${process.env.TOKEN_SYMBOL}`}
          badgeColor='success'
        />
        {
          account.txCount !== undefined &&
          <TableCardRow
            name='Transaction Count'
            icon='fas fa-hashtag'
            badge={account.txCount}
          />
        }
      </TableCard>
    )
  }
}
