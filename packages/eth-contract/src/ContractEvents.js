import React, { PureComponent } from 'react'
import classnames from 'classnames'

import {
  UncontrolledButtonDropdown,
  ToolbarButton,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Card,
} from '@obsidians/ui-components'

import { Link } from 'react-router-dom'

import { networkManager } from '@obsidians/eth-network'

export default class ContractEvents extends PureComponent {
  state = {
    selected: 0,
    loading: false,
    error: '',
    logs: '',
  }

  selectAction (index) {
    this.setState({
      selected: index,
      loading: false,
      error: '',
      logs: '',
    })
  }

  getEventLogs = async selectedEvent => {
    if (this.state.loading) {
      return
    }
    this.setState({ loading: true, error: '', logs: '' })

    const { contract, value } = this.props
    let logs
    try {
      const status = await networkManager.sdk.getStatus()
      logs = await contract[selectedEvent.name].call(...Array(selectedEvent.inputs.length)).getLogs({
        fromEpoch: status.epochNumber - 9999 > 0 ? status.epochNumber - 9999 : 0,
        toEpoch: 'latest_state',
      })
    } catch (e) {
      console.warn(e)
      this.setState({ loading: false, error: e.message, logs: '' })
      return
    }

    this.setState({
      loading: false,
      error: '',
      logs: logs.reverse()
    })
  }

  renderEventSelector = () => {
    const events = this.props.abi
    const selectedEvent = events[this.state.selected] || {}

    return <>
      <UncontrolledButtonDropdown size='sm'>
        <DropdownToggle color='primary' caret className='rounded-0 border-0 px-2 border-right-1'>
          <i className='fas fa-function' />
          <code className='mx-1'><b>{selectedEvent.name}</b></code>
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem header>events</DropdownItem>
          {events.map((item, index) => (
            <DropdownItem
              key={item.name}
              className={classnames({ active: index === this.state.selected })}
              onClick={() => this.selectAction(index)}
            >
              <code>{item.name}</code>
            </DropdownItem>
          ))}
        </DropdownMenu>
      </UncontrolledButtonDropdown>
      <ToolbarButton
        id='contract-event'
        icon={this.state.executing ? 'fas fa-spin fa-spinner' : 'fas fa-play'}
        tooltip='Get event logs'
        className='border-right-1'
        onClick={() => this.getEventLogs(selectedEvent)}
      />
    </>
  }

  renderLogsTable = () => {
    const events = this.props.abi
    const selectedEvent = events[this.state.selected] || {}
    const columns = selectedEvent.inputs || []
    return (
      <div className='fixed-table'>
        <div>
          <table className='table table-sm table-hover table-striped'>
            <thead>
              <tr>
                <th scope='col'><div>epoch</div><div>epoch</div></th>
                {columns.map(({ name, type }) => (
                  <th key={`table-col-${name}`} scope='col'>
                    <div><div style={{ lineHeight: '1.1rem' }}>{name}</div><div style={{ lineHeight: '0.8rem', fontVariant: 'none', fontWeight: '300' }} className='small'>{type}</div></div>
                    <div><div style={{ lineHeight: '1.1rem' }}>{name}</div><div style={{ lineHeight: '0.8rem', fontVariant: 'none', fontWeight: '300' }} className='small'>{type}</div></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {this.renderTableBody(this.state.logs, columns)}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  renderTableBody = (rows, columns) => {
    if (this.state.loading) {
      return <tr><td align='middle' colSpan={columns.length + 1}>Loading...</td></tr>
    }
    if (!rows.length) {
      return <tr><td align='middle' colSpan={columns.length + 1}>(no data)</td></tr>
    }
    return rows.map((item, index) => (
      <tr key={`table-row-${index}`}>
        <td><code><small>{item.epochNumber}</small></code></td>
        {columns.map(({ name, type }, index2) => {
          let content = ''
          if (item.params?.object) {
            content = item.params.object[name]
          } else if (item.params?.array) {
            content = item.params.array[index2]
          }
          content = content ? content.toString() : ''

          if (type === 'address') {
            content = (
              <Link to={`/account/${content}`} className='text-body'>
                {content}
              </Link>
            )
          }
          return (
            <td key={`table-item-${index}-${name}`}>
              <code><small>{content}</small></code>
            </td>
          )
        })}
      </tr>
    ))
  }

  render () {
    return (
      <div className='d-flex flex-column align-items-stretch h-100'>
        <div className='d-flex border-bottom-1'>
          {this.renderEventSelector()}
        </div>
        <div
          className='btn-secondary d-flex align-items-center justify-content-between border-0 rounded-0 px-2 py-0'
          style={{ flex: 'none', height: '28px' }}
        >
          Event Logs
        </div>
        <Card body>
          {this.renderLogsTable()}
        </Card>
      </div>
    )
  }
}
