import React, { PureComponent } from 'react'

import {
  TableCard,
  TableCardRow,
  Badge,
} from '@obsidians/ui-components'

export default class AccountInfo extends PureComponent {
  render () {
    const { account } = this.props

    let codeHash = null
    if (account.codeHash !== '0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470') {
      codeHash = <>
        <Badge color='info' className='mr-2'>Hash</Badge>
        <code>{account.codeHash}</code>
      </>
    }

    return (
      <TableCard title='Information'>
        <TableCardRow
          name='Code'
          icon='fas fa-code'
          badge={codeHash ? null : '(None)'}
        >
          {codeHash}
        </TableCardRow>
      </TableCard>
    )
  }
}
