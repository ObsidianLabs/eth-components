import React, { PureComponent } from 'react'
import { t } from '@obsidians/i18n'

import {
  TableCard,
  TableCardRow,
  Badge,
} from '@obsidians/ui-components'
import { t } from '@obsidians/i18n'

export default class AccountInfo extends PureComponent {
  render () {
    const { account } = this.props

    let codeHash = null
    if (account.codeHash !== '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470') {
      codeHash = <>
        <Badge color='info' className='mr-2'>{t('explorer.hash')}</Badge>
        <code>{account.codeHash}</code>
      </>
    }

    return (
      <TableCard title={t('explorer.information')}>
        <TableCardRow
          name={t('explorer.code')}
          icon='fas fa-code'
          badge={codeHash ? null : `(${t('none')})`}
        >
          {codeHash}
        </TableCardRow>
      </TableCard>
    )
  }
}
