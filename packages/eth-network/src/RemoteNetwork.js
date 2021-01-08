import React, { PureComponent } from 'react'

import {
  TableCard,
  TableCardRow,
} from '@obsidians/ui-components'

import networkManager from './networkManager'

export default class RemoteNetwork extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      trend: null,
      status: null,
    }
  }

  componentDidMount () {
    this.refresh()
    this.h = setInterval(() => this.refreshBlock(), 1000)
  }

  componentDidUpdate (prevProps) {
    if (this.props.chain !== prevProps.chain) {
      this.refresh()
    }
  }

  componentWillUnmount () {
    clearInterval(this.h)
    this.h = undefined
  }

  async refresh () {
    this.setState({
      trend: null,
      status: null,
    })
    if (!networkManager.sdk) {
      return
    }
    const chain = this.props.chain
    const trend = await networkManager.sdk?.trend()
    if (this.props.chain === chain) {
      this.setState({ trend })
    }
  }

  async refreshBlock () {
    if (!networkManager.sdk) {
      return
    }
    try {
      const chain = this.props.chain
      const status = await networkManager.sdk?.getStatus()
      if (this.props.chain === chain) {
        this.setState({ status })
      }
    } catch (error) {
      this.setState({ status: null })
    }
  }

  render () {
    const { chain } = this.props
    const { status, trend } = this.state

    return (
      <div className='d-flex flex-1 flex-column overflow-auto'>
        <div className='d-flex'>
          <div className='col-6 p-0 border-right-black'>
            <TableCard title={`${process.env.CHAIN_NAME} Network (${chain})`}>
              <TableCardRow
                name='Node URL'
                badge={networkManager.sdk?.url}
                badgeColor='primary'
              />
              <TableCardRow
                name='Chain ID'
                badge={status?.chainId}
              />
              <TableCardRow
                name='TPS'
                badge={trend && Number(trend?.tps).toFixed(6)}
              />
            </TableCard>
          </div>
          <div className='col-6 p-0'>
            <TableCard title='Blocks'>
              <TableCardRow
                name='Epoch'
                badge={status?.epochNumber}
              />
              <TableCardRow
                name='Block Number'
                badge={status?.blockNumber}
              />
              <TableCardRow
                name='Block Time'
                badge={trend ? `${Number(trend.blockTime).toFixed(2)} s` : ''}
              />
              <TableCardRow
                name='Difficulty'
                badge={trend && Number(trend.difficulty).toFixed(0)}
              />
              <TableCardRow
                name='Hash Rate'
                badge={trend && Number(trend.hashRate).toFixed(0)}
              />
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


