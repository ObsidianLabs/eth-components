import React, { PureComponent } from 'react'

import {
  Modal,
  DebouncedFormGroup,
  FormGroup,
  Label,
} from '@obsidians/ui-components'
import headerActions from '@obsidians/eth-header'
import redux from '@obsidians/redux'
import notification from '@obsidians/notification'

import networkManager from '../networkManager'
import { t } from '@obsidians/i18n'

export default class CustomNetworkModal extends PureComponent {
  constructor(props) {
    super(props)
    this.state = {
      pending: false,
      status: null,
      modify: false,
      option: {}
    }
    this.modal = React.createRef()
    this.input = React.createRef()
  }

  openModal = (modify = false, option = {}) => {
    this.name = option.name
    this.setState({ pending: false, status: null, modify, option })
    this.modal.current?.openModal()
    setTimeout(() => this.input.current?.focus(), 100)
  }

  tryCreateSdk = async option => {
    this.setState({ pending: true })
    try {
      const status = await networkManager.updateCustomNetwork(option)
      if (status) {
        this.setState({ pending: false, status })
        return
      }
    } catch { }
    notification.error(t('network.custom.err'), t('network.custom.errText'))
    this.setState({ pending: false })
  }

  onConfirm = async () => {
    const { modify, status, option } = this.state
    const customNetworkMap = redux.getState().customNetworks.toJS()
    const customNetworkNames = Object.keys(customNetworkMap)
    const connected = customNetworkMap[this.name]?.active

    if (customNetworkNames.includes(option.name) && !modify) {
      notification.error(t('network.custom.invalidName'), t('network.custom.invalidNameText', {name: option.name}))
      return
    }
    if (!status) {
      this.tryCreateSdk({ ...option, notify: false })
    } else {
      let hasDuplicated
      const existChain = networkManager.networks.find(item => item.chainId === status.chainId)
      if (modify) {
        redux.dispatch('MODIFY_CUSTOM_NETWORK', { name: this.name, option, networkId: existChain?.id })
        if (connected) this.connect(option)
      } else {
        hasDuplicated = networkManager.hasDuplicatedNetwork(option.url)
        hasDuplicated ?
          notification.error(t('network.custom.duplicatedTitle'), t('network.custom.duplicatedText', { url: option.url }))
          : redux.dispatch('ADD_CUSTOM_NETWORK', {
            ...option,
            networkId: existChain?.id,
            chainId: this.state.status?.chainId
          })
      }
      if (hasDuplicated) return
      const newNetList = networkManager.getNewNetList()
      networkManager.addNetworks(newNetList)
      this.setState({ pending: false, status: null })
      this.modal.current.closeModal()
    }
  }

  connect = async option => {
    try {
      const status = await networkManager.updateCustomNetwork(option)
      if (status) {
        redux.dispatch('UPDATE_UI_STATE', { customNetworkOption: option })
        redux.dispatch('CHANGE_NETWORK_STATUS', true)
        headerActions.updateNetwork(option.name)
        networkManager.setNetwork({
          ...option,
          id: option.name
        })
        return
      }
    } catch { }
    notification.error(t('network.custom.err'), t('network.custom.errText'))
    redux.dispatch('CHANGE_NETWORK_STATUS', false)
  }

  filterStatus = (status) => {
    if (status && typeof status === 'object') {
      for (let i in status) {
        status[i] === 'unknown' && delete status[i]
      }
    }
    return status
  }

  renderNetworkInfo() {
    const networkInfo = this.state.modify ? this.filterStatus(this.state.status) : {
      chainId: this.state.status?.chainId,
      name: this.state.option?.name
    }

    const showInfo = !networkInfo ? false : Object.keys(networkInfo).length === 0 ? false : true
  
    return showInfo ?
    <FormGroup>
      <Label>Network info</Label>
      <pre className='text-body pre-wrap break-all small user-select mb-0'>
        {JSON.stringify(networkInfo, null, 2)}
      </pre>
    </FormGroup> : null
  }

  render() {
    const {
      placeholder = 'http(s)://...',
    } = this.props
    const { modify, pending, status, option } = this.state

    return (
      <Modal
        ref={this.modal}
        title={`${modify ? t('network.custom.modify') : t('header.title.new')} ${t('network.custom.customConnect')}`}
        pending={pending && t('network.custom.try')}
        textConfirm={status ? modify ? t('network.custom.update') : t('network.custom.add') : t('network.custom.check')}
        onConfirm={this.onConfirm}
        confirmDisabled={!option.name || !/^[0-9a-zA-Z\-_]*$/.test(option.name) || !/^(http(s)?:\/\/)\w+[^\s]+(\.[^\s]+){1,}$/.test(option.url)}>
        <DebouncedFormGroup
          ref={this.input}
          label='Name'
          maxLength='50'
          value={option.name}
          onChange={name => this.setState({ option: { ...option, name } })}
          validator={v => !/^[0-9a-zA-Z\-_]*$/.test(v) && 'Network name can only contain letters, digits, dash or underscore.'}
        />
        {/* <DebouncedFormGroup
          label='ChainId'
          placeholder={'Please enter a chainId'}
          maxLength='300'
          value={option.chainId}
          onChange={chainId => this.setState({ status: null, option: { ...option, chainId } })}
          validator={v => !/^[1-9][0-9]*$/.test(v) && 'ChainId can only contain digits, and first digits can not start with 0'}
        /> */}
        <DebouncedFormGroup
          label='URL of node rpc'
          placeholder={placeholder}
          maxLength='300'
          value={option.url}
          onChange={url => this.setState({ status: null, option: { ...option, url } })}
          validator={v => !/^(http(s)?:\/\/)\w+[^\s]+(\.[^\s]+){1,}$/.test(v) && 'RPC url has to be a network url'}
        />
        {this.renderNetworkInfo()}
      </Modal>
    )
  }
}
