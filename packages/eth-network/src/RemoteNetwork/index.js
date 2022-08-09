import React, { PureComponent } from 'react'
import redux from '@obsidians/redux'
import notification from '@obsidians/notification'
import { t } from '@obsidians/i18n'

import networkManager from '../networkManager'
import DefaultRemoteNetworkInfo from './RemoteNetworkInfo'

export default class RemoteNetwork extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      info: null,
      status: null,
    }
    this.clearTimeId = this.clearTimeId.bind(this)
  }

  componentDidMount () {
    this.timeId = setInterval(() => this.refreshBlock(), 3000)
  }
  
  clearTimeId() {
    this.timeId && clearInterval(this.timeId)
    this.timeId = undefined
  }

  componentWillUnmount () {
   this.clearTimeId()
  }


  async refreshBlock() {
    if (!networkManager.sdk) return
    try {
      const networkInfo = await networkManager.fetchNetworkInfo()
      if(!networkInfo) return
      this.setState({ status: networkInfo.status, info: networkInfo.info })
      redux.dispatch('CHANGE_NETWORK_STATUS', true)
    } catch (error) {
      console.warn(error)
      if (error.message.startsWith('missing response')) {
        notification.error(t('network.network.internetDis'))
      }
      this.clearTimeId()
      this.setState({ status: null })
      redux.dispatch('CHANGE_NETWORK_STATUS', false)
    }
  }

  render () {
    const {
      networkId,
      url,
      EditButton,
      RemoteNetworkInfo = DefaultRemoteNetworkInfo,
    } = this.props
    const { status, info } = this.state

    return (
      <div className='d-flex flex-1 flex-column overflow-auto'>
        <RemoteNetworkInfo
          networkId={networkId}
          url={url}
          EditButton={EditButton}
          info={info}
          status={status}
        />
        <div className='d-flex flex-fill'>
          <div className='col-12 p-0 border-top-black'>
          </div>
        </div>
      </div>
    )
  }
}


