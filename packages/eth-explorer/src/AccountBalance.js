import React from 'react'

import {
  TableCard,
  TableCardRow,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from '@obsidians/ui-components'

import { networkManager } from '@obsidians/eth-network'

export default function AccountBalance ({ account, history }) {
  const [tokens, setTokens] = React.useState([])
  React.useEffect(() => {
    networkManager.sdk.getTokens(account.address).then(tokens => {
      console.log(tokens)
      setTokens(tokens)
    })
  }, [])
  
  return (
    <TableCard title='Account' tableScroll>
      <TableCardRow
        name='Balance'
        icon='far fa-wallet'
        badge={`${new Intl.NumberFormat().format(account.balance)} ${process.env.TOKEN_SYMBOL}`}
        badgeColor='success'
      />
      {
        Boolean(tokens.length) &&
        <TableCardRow
          name='Tokens'
          icon='far fa-coins'
          right={
            <UncontrolledDropdown>
              <DropdownToggle caret className='badge badge-pill d-flex align-items-center' color='info'>
                {tokens.length}
              </DropdownToggle>
              <DropdownMenu className='dropdown-menu-sm'>
                <DropdownItem header>token balance</DropdownItem>
                {tokens.map(t => (
                  <DropdownItem key={t.address} onClick={() => history.push(`/account/${t.address}`) }>
                    <div className='d-flex flex-row justify-content-between align-items-end'>
                      <span>
                        <b>{new Intl.NumberFormat().format(t.balance / 10 ** t.decimals)} {t.symbol}</b>
                      </span>
                      <span className='small'>{t.name}</span>
                    </div>
                    <div className='small text-alpha-50'><code>{t.address}</code></div>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </UncontrolledDropdown>
          }
        />
      }
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
