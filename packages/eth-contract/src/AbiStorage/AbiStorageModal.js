import React, { PureComponent } from 'react'

import {
  Modal,
  Table,
  IconButton,
  DeleteButton,
  UncontrolledTooltip,
} from '@obsidians/ui-components'

import redux from '@obsidians/redux'
import notification from '@obsidians/notification'

import ViewAbiModal from './ViewAbiModal'
import AbiInputModal from './AbiInputModal'

export default class AbiStorageModal extends PureComponent {
  constructor (props) {
    super(props)

    this.modal = React.createRef()
    this.viewAbiModal = React.createRef()
    this.abiInputModal = React.createRef()

    this.state = {
      loading: false,
      abis: [],
      showPrivateKeys: false,
    }
  }

  openModal = () => {
    this.modal.current.openModal()
    this.refresh()
  }

  refresh () {
    this.setState({ loading: true })
    const abis = redux.getState().abis.toArray()
    this.setState({ abis, loading: false })
  }

  viewAbi = abi => {
    this.viewAbiModal.current.openModal(abi)
  }

  newAbi = async (inputName, inputCodeHash) => {
    const { name, codeHash, abi } = await this.abiInputModal.current.openModal(inputName, inputCodeHash)
    redux.dispatch('ABI_ADD', { name, codeHash, abi })
    notification.success(
      'ABI Added',
      `A new ABI record is added to the storage.`
    )
    this.refresh()
  }

  deleteAbi = async codeHash => {
    redux.dispatch('ABI_DELETE', codeHash)
    notification.info(
      'ABI Deleted',
      `The ABI record is removed from the storage.`
    )
    this.refresh()
  }

  renderTable = () => {
    if (this.state.loading) {
      return (
        <tr key='abis-loading' >
          <td align='middle' colSpan={3}>
            <i className='fas fa-spin fa-spinner mr-1' />Loading...
          </td>
        </tr>
      )
    }
    if (!this.state.abis || !this.state.abis.length) {
      return (
        <tr key='abis-none' >
          <td align='middle' colSpan={3}>
            (No ABIs)
          </td>
        </tr>
      )
    }
    return this.state.abis.map(this.renderAbiRow)
  }

  renderAbiRow = item => {
    const [codeHash, obj] = item
    const abi = obj.get('abi')
    try {
      abi = JSON.stringify(JSON.parse(abi), null, 2)
    } catch (e) {}
    return (
      <tr key={`abi-${codeHash}`} className='hover-flex'>
        <td>
          <div className='text-overflow-dots'>
            {obj.get('name') || 'asdkfasdhflkjasdhflkjasdhfkjlasfhsdakjfkfas'}
          </div>
        </td>
        <td className='pr-0'>
          <code className='small'>{codeHash}</code>
        </td>
        <td align='right'>
          <div className='d-flex flex-row justify-content-end hover-show'>
            <IconButton
              color='transparent'
              id={`show-abi-${codeHash}`}
              className='text-muted'
              icon='fas fa-eye'
              onClick={() => this.viewAbi(abi)}
            >
              <UncontrolledTooltip delay={0} placement='top' target={`show-abi-${codeHash}`}>
                Show ABI
              </UncontrolledTooltip>
            </IconButton>
            <DeleteButton
              onConfirm={() => this.deleteAbi(codeHash)}
            />
          </div>
        </td>
      </tr>
    )
  }

  render () {
    return <>
      <Modal
        ref={this.modal}
        title='ABI Storage'
        textActions={['New']}
        textCancel='Close'
        onActions={[this.newAbi]}
      >
        <Table
          tableSm
          TableHead={(
            <tr>
              <th style={{ width: '16%' }}>Name</th>
              <th style={{ width: '75%' }}>Code Hash / Address</th>
              <th style={{ width: '9%' }}></th>
            </tr>
          )}
        >
          {this.renderTable()}
        </Table>
      </Modal>
      <ViewAbiModal ref={this.viewAbiModal} />
      <AbiInputModal ref={this.abiInputModal} />
    </>
  }
}