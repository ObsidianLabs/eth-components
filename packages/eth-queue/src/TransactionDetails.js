import React, { PureComponent } from 'react'

import {
  ButtonOptions,
  Table,
  TableCardRow,
  Badge,
} from '@obsidians/ui-components'

import { utils } from '@obsidians/sdk'
import { Link } from 'react-router-dom'
import Highlight from 'react-highlight'

export default class TransactionDetails extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      selected: 'basic',
    }
    this.modal = React.createRef()
  }

  renderContent = (tx, selected) => {
    const { txHash, status, data } = tx
    const {
      contractAddress,
      functionName,
      contractName,
      signer, params,
      value,
      tx: txObject,
      error,
      receipt,
      abi,
    } = data || {}

    if (selected === 'basic') {
      return (
        <Table>
          <TableCardRow
            name='Hash'
            icon='fas fa-hashtag'
            badge={<code>{txHash}</code>}
          />
          <TableCardRow
            name='Status'
            icon='fad fa-spinner-third'
            badge={status === 'FAILED-TIMEOUT' ? 'TIMEOUT' : status}
            badgeColor={status.startsWith('FAILED') ? 'danger' : status === 'CONFIRMED' ? 'success' : 'warning'}
          />
          { this.renderError(error) }
          {
            contractAddress &&
            <TableCardRow
              name='Contract'
              icon='fas fa-file-invoice'
              badge={(
                <Link
                  to={`/contract/${contractAddress}`}
                  className='text-body'
                  onClick={() => this.props.closeModal()}
                >
                  <code>{contractAddress}</code>
                </Link>
              )}
            />
          }
          {
            functionName &&
            <TableCardRow
              name='Function'
              icon='fas fa-function'
              badge={functionName}
            />
          }
          {
            contractName &&
            <TableCardRow
              name='Contract Name'
              icon='fas fa-file-invoice'
              badge={contractName}
            />
          }
          {
            value &&
            <TableCardRow
              name={`${process.env.TOKEN_SYMBOL} Transfered`}
              icon='fas fa-coins'
              badge={`${utils.unit.fromValue(value)} ${process.env.TOKEN_SYMBOL}`}
            />
          }
          <TableCardRow
            name='Signer'
            icon='fas fa-key'
            badge={(
              <Link
                to={`/account/${signer}`}
                className='text-body'
                onClick={() => this.props.closeModal()}
              >
                <code>{signer}</code>
              </Link>
            )}
          />
          {
            receipt && receipt.contractCreated &&
            <TableCardRow
              name='Contract Created'
              icon='fas fa-file-invoice'
              badge={(
                <Link
                  to={`/contract/${receipt.contractCreated}`}
                  className='text-body'
                  onClick={() => this.props.closeModal()}
                >
                  <code>{receipt.contractCreated}</code>
                </Link>
              )}
            />
          }
        </Table>
      )
    } else if (selected === 'params') {
      return (
        <Highlight language='javascript' className='pre-box bg2 pre-wrap break-all small my-0' element='pre'>
          <code>{JSON.stringify(params, null, 2)}</code>
        </Highlight>
      )
    } else if (selected === 'tx') {
      return (
        <Highlight language='javascript' className='pre-box bg2 pre-wrap break-all small my-0' element='pre'>
          <code>{JSON.stringify(txObject, null, 2)}</code>
        </Highlight>
      )
    } else if (selected === 'receipt') {
      return (
        <Highlight language='javascript' className='pre-box bg2 pre-wrap break-all small my-0' element='pre'>
          <code>{JSON.stringify(receipt, null, 2)}</code>
        </Highlight>
      )
    } else if (selected === 'abi') {
      return (
        <Highlight language='javascript' className='pre-box bg2 pre-wrap break-all small my-0' element='pre'>
          <code>{JSON.stringify(abi, null, 2)}</code>
        </Highlight>
      )
    }
  }

  renderError = error => {
    if (!error) {
      return null
    }

    const {
      code = '',
      message = '',
      data = '',
    } = error

    return (
      <TableCardRow
        name='Error'
        icon='fas fa-exclamation-triangle'
        badge={code}
        badgeColor='danger'
      >
        <div className='mt-2'>{message}</div>
        { data &&
          <div className='mt-1'>
            <Badge color='secondary' className='mr-1 p-relative' style={{ top: -1 }}>data</Badge>
            {data}
          </div>
        }
      </TableCardRow>
    )
  }

  render () {
    const tx = this.props.tx || {}
    const selected = this.state.selected

    const options = [
      { key: 'basic', text: 'Basic' },
      { key: 'params', text: 'Parameters' },
    ]
    if (tx.data?.tx) {
      options.push({ key: 'tx', text: 'Tx' })
    }
    if (tx.data?.receipt) {
      options.push({ key: 'receipt', text: 'Receipt' })
    }
    if (tx.data?.abi) {
      options.push({ key: 'abi', text: 'ABI' })
    }

    return <>
      <div>
        <ButtonOptions
          size='sm'
          className='mb-3'
          options={options}
          selected={selected}
          onSelect={selected => this.setState({ selected })}
        />
      </div>
      {this.renderContent(tx, selected)}
    </>
  }
}
