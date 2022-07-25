import React, { PureComponent } from 'react'

import {
  ButtonOptions,
  Table,
  TableCardRow,
  Badge,
} from '@obsidians/ui-components'

import { networkManager } from '@obsidians/eth-network'
import { ResultContent } from '@obsidians/eth-contract'
import { withRouter } from 'react-router-dom'
import Highlight from 'react-highlight'
import { t } from '@obsidians/i18n'
import fileOps from '@obsidians/file-ops'

class TransactionDetails extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      selected: 'basic',
      format: 'pretty',
    }
    this.modal = React.createRef()
  }

  handleClick = (address, type, explorerUrl) => {
    this.props.closeModal()
    if (type === 'explorer' && explorerUrl) {
      fileOps.current.openLink(`${explorerUrl}${address}`)
      return
    }
    this.props.history.push(address)
  }

  renderContent = () => {
    const { tx = {}, closeModal } = this.props
    const { selected, format } = this.state
    const { txHash, status, data = {} } = tx
    const {
      functionName,
      contractName,
      signer, params,
      value,
      confirmed,
      transaction,
      result,
      error,
      receipt,
      abi,
    } = data
    const contractAddress = receipt?.contractAddress || data.contractAddress
    const networkId = networkManager.sdk?.txManager?.client?.networkId
    const explorerUrl = networkManager.networks.find(item => networkId === item.id)?.explorerUrl

    if (selected === 'basic') {
      return (
        <Table>
          <TableCardRow
            name={t('contract.transaction.hash')}
            icon='fas fa-hashtag'
            badge={(
              <a href='javascript:void(0)'
                onClick={() => this.handleClick(`/tx/${txHash}`, 'explorer', explorerUrl)}
                className='text-body'
              >
                <code>{txHash}</code>
              </a>
            )}
          />
          <TableCardRow
            name={t('contract.transaction.status')}
            icon='fad fa-spinner-third'
            badge={status === 'FAILED-TIMEOUT' ? 'TIMEOUT' : status}
            badgeColor={status.startsWith('FAILED') ? 'danger' : status === 'CONFIRMED' ? 'success' : 'warning'}
          />
          { this.renderError(error) }
          {
            contractAddress &&
            <TableCardRow
              name={t('contract.transaction.contract')}
              icon='fas fa-file-invoice'
              badge={(
                <a href='javascript:void(0)'
                  onClick={() => this.handleClick(`/contract/${contractAddress}`)}
                  className='text-body'
                >
                  <code>{contractAddress}</code>
                </a>
              )}
            />
          }
          {
            functionName &&
            <TableCardRow
              name={t('contract.transaction.function')}
              icon='fas fa-function'
              badge={functionName}
            />
          }
          {
            contractName &&
            <TableCardRow
              name={t('contract.transaction.contractName')}
              icon='fas fa-file-invoice'
              badge={contractName}
            />
          }
          {
            value &&
            <TableCardRow
              name={`${networkManager.symbol} Sent`}
              icon='fas fa-coins'
              badge={`${networkManager.sdk?.utils.unit.fromValue(value)} ${networkManager.symbol}`}
            />
          }
          {
            confirmed &&
            <TableCardRow
              name={t('rpc.result')}
              icon='fas fa-sign-out'
              badge={confirmed}
            />
          }
          <TableCardRow
            name={t('contract.deploy.signer')}
            icon='fas fa-key'
            badge={(
              <a
                href='javascript:void(0)'
                onClick={() => this.handleClick(`/account/${signer}`)}
                className='text-body'
              >
                <code>{signer}</code>
              </a>
            )}
          />
          {
            receipt && receipt.contractCreated &&
            <TableCardRow
              name='Contract Created'
              icon='fas fa-file-invoice'
              badge={(
                <a
                  href='javascript:void(0)'
                  onClick={() => this.handleClick(`/contract/${receipt.contractCreated}`)}
                  className='text-body'
                >
                  <code>{receipt.contractCreated}</code>
                </a>
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
          <code>{JSON.stringify(transaction, null, 2)}</code>
        </Highlight>
      )
    } else if (selected === 'receipt') {
      return (
        <Highlight language='javascript' className='pre-box bg2 pre-wrap break-all small my-0' element='pre'>
          <code>{JSON.stringify(receipt, null, 2)}</code>
        </Highlight>
      )
    } else if (selected === 'result') {
      return <>
        <div>
          <ButtonOptions
            size='sm'
            options={[{ key: 'pretty', text: 'Pretty' }, { key: 'raw', text: 'Raw' }]}
            selected={format}
            onSelect={format => this.setState({ format })}
          />
        </div>
        <ResultContent format={format} actionResult={result} onNavigate={closeModal} />
      </>
    } else if (selected === 'error') {
      return (
        <Highlight language='javascript' className='pre-box bg2 pre-wrap break-all small my-0' element='pre'>
          <code>{JSON.stringify(error, null, 2)}</code>
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
    const { selected } = this.state

    const options = [
      { key: 'basic', text: t('contract.estimate.basic') },
      { key: 'params', text: t('rpc.parameters') },
    ]
    if (tx.data?.transaction) {
      options.push({ key: 'tx', text: 'Tx' })
    }
    if (tx.data?.receipt) {
      options.push({ key: 'receipt', text: t('contract.estimate.receipt') })
    }
    if (tx.data?.result) {
      options.push({ key: 'result', text: t('rpc.result') })
    }
    if (tx.data?.error) {
      options.push({ key: 'error', text: t('contract.estimate.error') })
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
      {this.renderContent()}
    </>
  }
}

export default withRouter(TransactionDetails)