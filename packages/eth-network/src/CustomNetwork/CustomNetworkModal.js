import React, { PureComponent } from 'react'
import headerActions from '@obsidians/eth-header'
import {
  Modal,
  Table,
  Button,
  IconButton,
  DeleteButton,
} from '@obsidians/ui-components'

import redux from '@obsidians/redux'
import notification from '@obsidians/notification'

import networkManager from '../networkManager'
import NewCustomNetworkModal from './NewCustomNetworkModal'

export default class CustomNetworkModal extends PureComponent {
  constructor(props) {
    super(props)
    this.state = { connecting: '', customNetworkItem: null }
    this.modal = React.createRef()
    this.newConnectionModal = React.createRef()
    this.deleteModal = React.createRef()
  }

  openModal = (customNetwork = {}) => {
    this.setState({ connecting: '' })
    this.modal.current?.openModal()
  }

  openNewConnectionModal = (modify, option) => {
    this.newConnectionModal.current?.openModal(modify, option)
  }

  delete = item => {
    this.deleteModal.current?.openModal()
    this.setState({
      customNetworkItem: item,
    })
  }

  deleteConfirm = async () => {
    const currentNetwork = this.state.customNetworkItem?.name
    this.deleteModal.current.closeModal()
    const customNetworkMap = redux.getState().customNetworks.toJS()

    if (redux.getState().networkConnect && customNetworkMap[currentNetwork].active) {
      this.modal.current.closeModal()
      networkManager.setNetwork(networkManager.networks[0], {
        redirect: false,
        notify: false
      })
    }
    networkManager.deleteNetwork(currentNetwork)
    redux.dispatch('REMOVE_CUSTOM_NETWORK', currentNetwork)
  }

  connect = async option => {
    try {
      this.setState({ connecting: option.name })
      const status = await networkManager.updateCustomNetwork(option)
      if (status) {
        redux.dispatch('UPDATE_UI_STATE', { customNetworkOption: option })
        redux.dispatch('SELECT_NETWORK', option.name)
        redux.dispatch('CHANGE_NETWORK_STATUS', true)
        this.modal.current?.closeModal()
        this.setState({ connecting: '' })
        headerActions.updateNetwork(option.name)
        networkManager.setNetwork({
          ...option,
          id: option.name
        })
        return
      }
    } catch { }
    notification.error('Network Error', 'Failed to connect the network. Make sure you entered a valid url for the node RPC.')
    this.setState({ connecting: '' })
  }

  renderTableBody = () => {
    const connecting = this.state.connecting
    const customNetworks = this.props.customNetworks.toArray()
    customNetworks.sort((a, b) => a[0].localeCompare(b[0]))

    if (customNetworks.length) {
      return customNetworks.map(([name, item], i) => (
        <tr key={`custom-network-${i}`} className='hover-flex'>
          <td>{name}</td>
          <td className='text-overflow-dots'>{item.get('url')}</td>
          <td align='right'>
            <div className='d-flex align-items-center justify-content-between'>
              <Button
                key={connecting === name ? `${name}-connecting` : `${name}-connect`}
                size='sm'
                color='success'
                onClick={() => this.connect(item.toJS())}
              >
                {
                  connecting === name
                    ? <><i className='fas fa-spin fa-spinner mr-1' />Connecting...</> : 'Connect'
                }
              </Button>
              {
                connecting !== name &&
                <div className='d-flex hover-show'>
                  <IconButton
                    color='transparent'
                    className='text-muted'
                    onClick={() => this.openNewConnectionModal(true, item.toJS())}
                    icon='fas fa-pencil-alt'
                  />
                  <IconButton
                    color='transparent'
                    className='ml-1 text-muted delete-test'
                    onClick={() => this.delete(item.toJS())}
                  />
                </div>
              }
            </div>
          </td>
        </tr>
      ))
    }
    return <tr key='custom-network-none'><td align='middle' colSpan={3}>(No Custom Networks)</td></tr>
  }

  render() {
    const networkConnectingText = 'it will be disconnected immediately and cannot be restored.'
    const networkNotConnectedText = 'it cannot be restored.'
    const currentNetwork = this.state.customNetworkItem?.name
    const customNetworkMap = redux.getState().customNetworks.toJS()
    const connected = redux.getState().networkConnect && customNetworkMap[currentNetwork]?.active

    return <>
      <Modal
        ref={this.modal}
        title='Custom Network'
        textActions={['New Connection']}
        onActions={[() => this.openNewConnectionModal()]}
      >
        <Table
          tableSm
          TableHead={(
            <tr>
              <th style={{ width: '20%' }}>name</th>
              <th style={{ width: '55%' }}>rpc url</th>
              <th></th>
            </tr>
          )}
        >
          {this.renderTableBody()}
        </Table>
      </Modal>
      <Modal
        ref={this.deleteModal}
        title='Delete Custom Network'
        size='md'
        textConfirm='Delete'
        noCancel={true}
        onConfirm={this.deleteConfirm}
      >
        <div>
          Are you sure you want to delete <kbd className='color-danger'>{this.state.customNetworkItem?.name}</kbd> ? Once deleted, {connected ? networkConnectingText : networkNotConnectedText}
        </div>
      </Modal>
      <NewCustomNetworkModal ref={this.newConnectionModal} />
    </>
  }
}
