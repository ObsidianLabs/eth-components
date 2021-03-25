import React, { PureComponent } from 'react'

import {
  TableCard,
  TableCardRow,
} from '@obsidians/ui-components'
import { t } from '@obsidians/i18n'

export default class AccountBalance extends PureComponent {
  render () {
    const { account } = this.props

    return (
      <TableCard title={t('explorer.balance')}>
        <TableCardRow
          name={t('explorer.total')}
          icon='far fa-wallet'
          badge={`${account.balance} ${process.env.TOKEN_SYMBOL}`}
          badgeColor='success'
        />
        {
          account.count !== undefined &&
          <TableCardRow
            name={t('explorer.transactions')}
            icon='far fa-wallet'
            badge={account.count}
          />
        }
      </TableCard>
    )
  }
}
