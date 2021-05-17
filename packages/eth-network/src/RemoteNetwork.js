import React, { PureComponent } from 'react'

import {
  TableCard,
  TableCardRow,
} from '@obsidians/ui-components'

import moment from 'moment'
import notification from '@obsidians/notification'

import networkManager from './networkManager'

export default class RemoteNetwork extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      info: props.info || null,
      status: null,
    }
  }

  componentDidMount () {
    this.refresh()
    this.h = setInterval(() => this.refreshBlock(), 5000)
  }

  componentDidUpdate (prevProps) {
    if (this.props.info !== prevProps.info) {
      this.setState({ info: this.props.info })
    }
    if (this.props.networkId !== prevProps.networkId) {
      this.refresh()
    }
  }

  componentWillUnmount () {
    if (this.h) {
      clearInterval(this.h)
    }
    this.h = undefined
  }

  async refresh () {
    this.setState({
      info: null,
      status: null,
    })
    if (!networkManager.sdk) {
      return
    }
    this.refreshBlock()
    const networkId = this.props.networkId
    const info = await networkManager.sdk?.networkInfo()
    if (this.props.networkId === networkId) {
      this.setState({ info })
    }
  }

  async refreshBlock () {
    if (!networkManager.sdk) {
      return
    }
    try {
      const networkId = this.props.networkId
      const status = await networkManager.sdk?.getStatus()
      if (this.props.networkId === networkId) {
        this.setState({ status })
      }
    } catch (error) {
      console.warn(error)
      if (error.message === 'Failed to fetch') {
        notification.error('Internet Disconnected')
        if (this.h) {
          clearInterval(this.h)
        }
        this.h = undefined
      }
      this.setState({ status: null })
    }
  }

  render () {
    const { networkId, EditButton } = this.props
    const { status, info } = this.state

    return (
      <div className='d-flex flex-1 flex-column overflow-auto'>
        <div className='d-flex'>
          <div className='col-6 p-0 border-right-black'>
            <TableCard
              title={`${process.env.CHAIN_NAME} Network (${networkId})`}
              right={EditButton}
            >
              {
                info?.url &&
                <TableCardRow
                  name='URL'
                  badge={info?.url}
                />
              }
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
            <TableCard title='Blocks'>
              {
                status?.number &&
                <TableCardRow
                  name='Block Number'
                  badge={status?.number}
                />
              }
              {
                status?.timestamp &&
                <TableCardRow
                  name='Block Time'
                  badge={moment(status.timestamp * 1000).format('MMMM Do, HH:mm:ss')}
                />
              }
              {
                status?.difficulty &&
                <TableCardRow
                  name='Difficulty'
                  badge={status && Number(status.difficulty).toFixed(0)}
                />
              }
            </TableCard>
          </div>
        </div>
        <div className='d-flex flex-fill'>
          <div className='col-12 p-0 border-top-black'>
          </div>
        </div>
      </div>
    )
  }
}


