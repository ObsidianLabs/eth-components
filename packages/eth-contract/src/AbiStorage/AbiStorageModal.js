import React, { PureComponent } from 'react'
import { utils } from '@obsidians/sdk'

import {
  Modal,
  Table,
  IconButton,
  DeleteButton,
  UncontrolledTooltip,
} from '@obsidians/ui-components'

import redux from '@obsidians/redux'
import notification from '@obsidians/notification'
import { t } from '@obsidians/i18n'

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

  viewAbi = async data => {
    let formattedAbi = ''
    try {
      formattedAbi = JSON.stringify(JSON.parse(data.abi), null, 2)
    } catch {
      notification.error(t('abi.fail'), t('abi.failText'))
    }
    const { name, codeHash, abi } = await this.abiInputModal.current.openModal(data.name, data.codeHash, formattedAbi)
    redux.dispatch('ABI_UPDATE', [data.codeHash, { name, codeHash, abi }])
    notification.success(
      t('abi.update'),
      t('abi.updateText')
    )
    this.refresh()
  }

  newAbi = async (inputName, inputCodeHash) => {
    const { name, codeHash, abi } = await this.abiInputModal.current.openModal(inputName, inputCodeHash)
    redux.dispatch('ABI_ADD', { name, codeHash, abi })
    notification.success(
      t('abi.add'),
      t('abi.addText')
    )
    this.refresh()
  }

  deleteAbi = async codeHash => {
    redux.dispatch('ABI_DELETE', codeHash)
    notification.info(
      t('abi.del'),
      t('abi.delText')
    )
    this.refresh()
  }

  renderTable = () => {
    if (this.state.loading) {
      return (
        <tr key='abis-loading' >
          <td align='middle' colSpan={3}>
            <i className='fas fa-pulse fa-spinner mr-1' />{t('loading')}...
          </td>
        </tr>
      )
    }
    if (!this.state.abis || !this.state.abis.length) {
      return <tr key='abis-none' ><td align='middle' colSpan={3}>(No ABIs)</td></tr>
    }
    return this.state.abis.map(this.renderAbiRow)
  }

  renderAbiRow = (item, index) => {
    const [codeHash, obj] = item
    const abi = obj.get('abi')
    const name = obj.get('name')
    try {
      abi = JSON.stringify(JSON.parse(abi), null, 2)
    } catch (e) {}
    let key = btoa(codeHash)
    key = key.replace(/=/g, '')
    return (
      <tr key={`abi-${key}`} className='hover-flex'>
        <td>
          <div className='text-overflow-dots'>{name}</div>
        </td>
        <td className='pr-0'>
          <code className='small'>{utils.formatAddress(codeHash)}</code>
        </td>
        <td align='right'>
          <div className='d-flex flex-row justify-content-end hover-show'>
            <IconButton
              color='transparent'
              id={`show-abi-${key}`}
              className='text-muted'
              icon='fas fa-pencil-alt'
              onClick={() => this.viewAbi({ name, codeHash, abi })}
            >
              <UncontrolledTooltip delay={0} placement='top' target={`show-abi-${key}`}>
                Edit
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
        size='lg'
        title={t('abi.storage')}
        textActions={[t('header.title.new')]}
        textCancel={t('component.text.close')}
        onActions={[() => this.newAbi()]}
      >
        <Table
          tableSm
          TableHead={(
            <tr>
              <th style={{ width: '20%' }}>{t('abi.name')}</th>
              <th style={{ width: '70%' }}>{t('abi.codeHash')} / {t('abi.address')}</th>
              <th style={{ width: '10%' }}></th>
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