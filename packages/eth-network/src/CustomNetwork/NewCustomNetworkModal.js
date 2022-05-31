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
      option: {},
      originalOption: {},
    }
    this.modal = React.createRef()
    this.input = React.createRef()
  }

  openModal = (modify = false, option = {}) => {
    this.name = option.name
    this.setState({ pending: false, status: null, modify, option, originalOption: option })
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
    const { modify, status, option, originalOption } = this.state
    const customNetworkMap = redux.getState().customNetworks.toJS()
    const customNetworkNames = Object.keys(customNetworkMap);
    const connected = customNetworkMap[option.name]?.active;

    if (customNetworkNames.includes(option.name) && !modify) {
      notification.error(t('network.custom.invalidName'), t('network.custom.invalidNameText', {name: option.name}))
      return
    } else {
      if (!status) {
        this.tryCreateSdk({ ...option, notify: false })
      } else {
        if (modify) {
          redux.dispatch('MODIFY_CUSTOM_NETWORK', { name: this.name, option })
          if (option.url.trim() !== originalOption.url && connected) {
            this.connect(option)
          }
        } else {
          redux.dispatch('ADD_CUSTOM_NETWORK', option)
        }
        const customeNetworkMap = redux.getState().customNetworks.toJS()
        const customeNetworkGroup = Object.keys(customeNetworkMap).map(name => ({
          group: 'others',
          icon: 'fas fa-vial',
          id: name,
          networkId: name,
          name: name,
          fullName: name,
          notification: `${t('network.network.switchedTo')} <b>${name}</b>.`,
          url: customeNetworkMap[name].url,
        })).sort((a, b) => a.name.localeCompare(b.name))
        const newNetworks = networkManager.networks.filter(item => item.group !== 'others' || item.id === 'others').concat([{
          fullName: 'Custom Network',
          group: 'others',
          icon: 'fas fa-vial',
          id: 'custom',
          name: 'Custom',
          notification: `${t('network.network.switchedTo')} <b>Custom</b> ${t('network.network.networkLow')}.`,
          symbol: 'ETH',
          url: '',
        }]).concat(customeNetworkGroup)
        networkManager.addNetworks(newNetworks)

        this.setState({ pending: false, status: null })
        this.modal.current.closeModal()
      }
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
        confirmDisabled={!option.name || !/^[0-9a-zA-Z\-_]*$/.test(option.name) || !option.url}
      >
        <DebouncedFormGroup
          ref={this.input}
          label='Name'
          maxLength='50'
          value={option.name}
          onChange={name => this.setState({ option: { ...option, name } })}
          validator={v => !/^[0-9a-zA-Z\-_]*$/.test(v) && 'Network name can only contain letters, digits, dash or underscore.'}
        />
        <DebouncedFormGroup
          label='URL of node rpc'
          placeholder={placeholder}
          maxLength='300'
          value={option.url}
          onChange={url => this.setState({ status: null, option: { ...option, url } })}
        />
        {
          status &&
          <FormGroup>
            <Label>Network info</Label>
            <pre className='text-body pre-wrap break-all small user-select mb-0'>
              {JSON.stringify(status, null, 2)}
            </pre>
          </FormGroup>
        }
      </Modal>
    )
  }
}
