import React, { PureComponent } from 'react'

import {
  TableCard,
  TableCardRow,
} from '@obsidians/ui-components'
import { t } from '@obsidians/i18n'

import moment from 'moment'
import networkManager from '../networkManager'

export default class RemoteNetworkInfo extends PureComponent {
  render () {
    const { networkId, url, EditButton, info, status } = this.props

    return (
      <div className='d-flex'>
        <div className='col-6 p-0 border-right-black'>
          <TableCard
            title={networkManager.current?.fullName}
            right={EditButton}
          >
            {
              networkManager.current?.group !== 'others' && networkManager.current?.symbol &&
              <TableCardRow
                name={t('header.title.nativeCoin')}
                badge={networkManager.current?.symbol}
              />
            }
            <TableCardRow name={t('header.title.nodeURL')} badge={url} badgeColor='primary' />
            {
              info?.chainId &&
              <TableCardRow
                name='Chain ID'
                badge={info?.chainId}
              />
            }
            {
              info?.ensAddress &&
              <TableCardRow
                name='ENS'
                badge={info?.ensAddress}
              />
            }
          </TableCard>
        </div>
        <div className='col-6 p-0'>
          <TableCard title={t('header.title.blocks')}>
            {
              status?.number &&
              <TableCardRow
                name={t('header.title.blockNumber')}
                badge={status?.number}
              />
            }
            {
              status?.timestamp &&
              <TableCardRow
                name={t('header.title.blockTime')}
                badge={moment(status.timestamp * 1000).format('MMMM Do, HH:mm:ss')}
              />
            }
            {
              Boolean(status?.difficulty) &&
              <TableCardRow
                name='Difficulty'
                badge={status && Number(status.difficulty).toFixed(0)}
              />
            }
          </TableCard>
        </div>
      </div>
    )
  }
}
