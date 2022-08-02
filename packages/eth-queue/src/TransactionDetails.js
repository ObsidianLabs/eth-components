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
import moment from 'moment'

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
    if (type === 'explorer' && explorerUrl) {
      fileOps.current.openLink(`${explorerUrl}${address}`)
      return
    }
    this.props.closeModal()
    this.props.history.push(address)
  }

  transferGasTableBody = data => {
    const {
      receipt,
      transaction,
    } = data || {}

    const cardRows = [
      {name: 'Gas Limit', value: transaction?.gasLimit},
      {name: 'Gas Used', value: (receipt?.gasUsed || transaction?.gasUsed)},
      {name: 'Gas Price', value: transaction?.gasPrice},
      {name: 'L1 Gas Used', value: receipt?.l1GasUsed, hidden: !receipt?.l1GasUsed},
      {name: 'L1 Gas Price', value: receipt?.l1GasPrice, hidden: !receipt?.l1GasPrice},
      {name: 'Max Fee Per Gas', value: transaction?.maxFeePerGas},
      {name: 'Max Priority Fee Per Gas', value: transaction?.maxPriorityFeePerGas && `Max Priority: ${transaction?.maxPriorityFeePerGas}`},
      {name: 'Effective Gas Price', valueList: receipt?.effectiveGasPrice?.hex && [`Type: ${receipt?.effectiveGasPrice?.type || 'BigNumber'}`, `Hex: ${receipt?.effectiveGasPrice?.hex}`]},
      {name: 'Cumulative Gas Used', value: receipt?.cumulativeGasUsed},
      {name: 'Type', value: (receipt?.type === 2 ? '2 (EIP-1559)' : '0'), icon: 'fas fa-file-spreadsheet'},
    ]

    return (
      <Table>
        {
          cardRows.map(({name, icon, value, valueList, hidden = false}) => (
            !hidden &&
            <TableCardRow
              name={name}
              icon={icon || 'fas fa-coins'}
              badge={value}
              badgeList={valueList}
            />
          ))
        }
      </Table>
    )
  }

  basicTableBody = (tx = {}, explorerUrl, transferType) => {
    let { txHash, status, data = {} } = tx
    const statusBadgeColor = status.startsWith('FAILED') ? 'danger' : (status === 'CONFIRMED' || status === 'SUCCESS') ? 'success' : 'warning'
    const {
      functionName,
      contractName,
      signer,
      value,
      confirmed,
      error,
      receipt,
      transaction,
    } = data
    transferType = transferType === 'generalTransfer' ? true : false
    const contractAddress = receipt?.contractAddress || data.contractAddress
    const transactionFee = receipt?.transactionFee || transaction?.gasPrice && receipt?.gasUsed && ((transaction.gasPrice * receipt.gasUsed) / (Math.pow(10, 18)))
    const signerCodeName = transferType ? `From (${t('contract.deploy.signer')})` : t('contract.deploy.signer')
    const networkSymbol = networkManager.symbol || networkManager?.networks.find(item => item.id === networkManager?.network.networkId)?.symbol || ''

    return (
      <Table>
        <TableCardRow
          name='Tx Hash'
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
          badgeColor={statusBadgeColor}
        />
        <TableCardRow
          name={'Block'}
          icon='fas fa-cube'
          badge={receipt?.blockNumber}
        />
        {
          tx?.ts &&
          <TableCardRow
            name={'Time'}
            icon='fas fa-clock'
            badge={moment(tx.ts * 1000).format('YYYY/MM/DD HH:mm:ss')}
          />
        }
        <TableCardRow
          name={signerCodeName}
          icon={transferType ? 'fas fa-map-marker-alt' : 'fas fa-key' }
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
          receipt?.to &&
          <TableCardRow
            name={`To`}
            icon='fas fa-map-marker-alt'
            badge={(
              <a
                href='javascript:void(0)'
                onClick={() => this.handleClick(`/account/${receipt.to}`)}
                className='text-body'
              >
                <code>{receipt.to}</code>
              </a>
            )}
          />
        }
        {
          value &&
          <TableCardRow
            name={transferType ? `Value` : `${networkSymbol} Sent`}
            icon='fas fa-coins'
            badge={`${networkManager.sdk?.utils.unit.fromValue(value)} ${networkSymbol}`}
          />
        }
        <TableCardRow
          name={`Transaction Fee`}
          icon='fas fa-coins'
          badge={transactionFee && `${transactionFee} ${networkSymbol}`}
        />
        <TableCardRow
          name='Nonce'
          icon='fas fa-hashtag'
          badge={transaction?.nonce}
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
          confirmed &&
          <TableCardRow
            name={t('rpc.result')}
            icon='fas fa-sign-out'
            badge={confirmed}
          />
        }
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
  }

  renderContent = () => {
    const { tx = {}, closeModal, transferType, explorerUrl } = this.props
    const { selected, format } = this.state
    const { data = {} } = tx
    const {
      params,
      transaction,
      functionName,
      result,
      error,
      receipt,
      abi,
    } = data

    if (selected === 'basic') {
      return this.basicTableBody(tx, explorerUrl, transferType)
    } else if (selected === 'gas') {
      return this.transferGasTableBody(data)
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
    } else if (selected === 'data') {
      return (
        <Highlight language='javascript' className='pre-box bg2 pre-wrap break-all small my-0' element='pre'>
          <code>{JSON.stringify({Signhash: abi, 'Input Data': transaction?.data, Function: functionName}, null, 2)}</code>
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
    const { tx = {}, transferType = '' } = this.props
    const { selected } = this.state

    const options = [
      { key: 'basic', text: t('contract.estimate.basic') },
      { key: 'params', text: t('rpc.parameters') },
    ]
    if (transferType === 'generalTransfer') {
      options.pop()
      options.push({ key: 'gas', text: 'Gas' })
    }
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
    if (transferType === 'generalTransfer') {
      options.push({ key: 'data', text: 'Data' })
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