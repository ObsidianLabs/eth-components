import React, { PureComponent } from 'react'
import classnames from 'classnames'

import {
  FormGroup,
  Label,
  DebouncedInput,
  Badge,
  MultiSelect,
  Modal,
} from '@obsidians/ui-components'
import { t } from '@obsidians/i18n'

import { networkManager } from '@obsidians/eth-network'
import { KeypairInputSelector } from '@obsidians/keypair'

import { utils } from '@obsidians/sdk'
import Contract from '../Contract'

const optionItemFromValue = (value, type) => {
  let icon = null
  let label = value.length > 10 ? `${value.substr(0, 8)}...` : value

  // if (format === 'file') {
  //   icon = <i className='fas fa-file mr-1' />
  //   label = fileOps.current.path.parse(value).base
  // } else if (format === 'utf8') {
  //   icon = <i className='fas fa-font-case mr-1'/>
  // } else if (format === 'hex') {
  //   icon = <i className='fas fa-code mr-1'/>
  // }

  return {
    value,
    label: <span key={`arg-${type}`}>{icon}{label}</span>
  }
}

class ArrayInput extends PureComponent {
  constructor (props) {
    super(props)

    this.modal = React.createRef()
    this.input = React.createRef()

    this.state = {
      values: props.value || [],
      data: '',
      title: '',
      errorInData: false,
    }

    this.options = [
      {
        label: t('contract.form.addItem'),
        options: [
          { label: `${t('contract.form.enter')}...`, getValue: this.enterNewItem },
        ]
      }
    ]
  }

  enterNewItem = async () => {
    this.setState({ newValue: '', title: t('contract.form.enterNewItem') })
    this.modal.current.openModal()
    // setTimeout(() => this.input.current.focus(), 100)
    return new Promise(resolve=> this.onResolve = resolve)
  }

  onClickItem = async ({ value }) => {
    this.setState({ newValue: value, title: t('contract.form.modifyItem') })
    this.modal.current.openModal()
    setTimeout(() => {
      // this.input.current.focus()
    }, 100)
    return new Promise(resolve=> this.onResolve = resolve)
  }

  onConfirm = () => {
    this.onResolve(optionItemFromValue(this.state.newValue, this.props.type))
    this.setState({ newValue: '' })
    this.modal.current.closeModal()
  }

  onChange = values => {
    this.setState({ values })
    this.props.onChange(values)
  }

  render () {
    const {
      size,
      addon,
      type,
      placeholder,
      textarea,
      unit,
    } = this.props
    return <>
      <MultiSelect
        size={size}
        addon={addon}
        options={this.options}
        value={this.state.values}
        onChange={this.onChange}
        onClickLabel={this.onClickItem}
      />
      <Modal
        ref={this.modal}
        overflow
        title={this.state.title}
        onConfirm={this.onConfirm}
        confirmDisabled={this.state.errorInData}
      >
        <ActionParamInput
          ref={this.input}
          type={type}
          value={this.state.newValue}
          onChange={newValue => this.setState({ newValue })}
          placeholder={placeholder}
          textarea={textarea}
          unit={unit}
        >
          {addon}
        </ActionParamInput>
      </Modal>
    </>
  }
}

export function ActionParamInput ({ size, type, value, onChange, placeholder, disabled, textarea, unit, children }) {
  const props = { value, onChange, disabled, placeholder }

  if (!type) {
    return <DebouncedInput size={size} addon={children} {...props} />
  }
  if (type.endsWith('[]')) {
    return (
      <ArrayInput
        size={size}
        addon={children}
        type={type.replace('[]', '')}
        placeholder={placeholder.replace('[]', '')}
        textarea={textarea}
        unit={unit}
        onChange={onChange}
      />
    )
  } else if (type === 'address') {
    return (
      <KeypairInputSelector
        size={size}
        editable
        maxLength={42}
        icon='fas fa-map-marker-alt'
        extra={networkManager.browserExtension?.isEnabled && [{
          group: networkManager.browserExtension.name.toLowerCase(),
          badge: networkManager.browserExtension.name,
          children: networkManager.browserExtension?.allAccounts?.map(address => ({ address })) || []
        }]}
        {...props}
      />
    )
  } else if (textarea) {
    return (
      <div style={{ position: 'relative' }}>
        <DebouncedInput type='textarea' size={size} {...props} />
        { unit && <Badge style={{ position: 'absolute', right: '5px', bottom: '5px', height: '18px', zIndex: 100 }}>{unit}</Badge> }
      </div>
    )
  } else {
    return (
      <DebouncedInput size={size} addon={children} {...props} />
    )
  }
}

export function ActionParamFormGroup ({ size, className, label, placeholder, value, onChange, icon }) {
  return (
    <FormGroup className={classnames(className, size === 'sm' && 'mb-2')}>
      <Label className={size === 'sm' && 'mb-1 small font-weight-bold'}>{label}</Label>
      <ActionParamInput
        size={size}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      >
        <span><i className={icon} /></span>
      </ActionParamInput>
    </FormGroup>
  )
}

const paramInputIcons = {
  address: 'fas fa-map-marker-alt',
  'address payable': 'fas fa-map-marker-alt',
  name: 'fas fa-user-tag',
  account_name: 'fas fa-user-tag',
  bool: 'fas fa-check',
  asset: 'fas fa-coins',
  permission_level: 'fas fa-user-shield',
  public_key: 'fas fa-key',
  checksum256: 'fas fa-hashtag'
}

export default class ContractForm extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      args: props.inputs?.map(({ value }) => value || '') || []
    }
  }

  componentDidMount () {
    if (this.props.args) {
      this.setState({ args: [...this.props.args] })
  }
  }

  componentWillReceiveProps (props) {
    if (props.inputs !== this.props.inputs) {
      this.setState({ args: props.inputs?.map(({ value }) => value || '') || [] })
    }
  }

  getData = () => {
    const data = {}
    this.props.inputs.forEach(({ name, type }, index) => {
      data[name] = this.state.args[index]
    })
    return data
  }

  getParameters = () => {
    const array = []
    const json = {}
    const obj = {}

    this.props.inputs.forEach(({ name, type }, index) => {
      const value = this.state.args[index]
      const key = name || `(param${index})`
      if (!type) {
        array.push(value)
        json[key] = value.toString()
        obj[key] = { type, value }
      } else if (type.endsWith('[]')) {
        const typedValue = value
          ? value.map((item, i) => this.valueByType(item.value, type.replace('[]', ''), `${key}[${i}]`))
          : []
        array.push(typedValue.map(v => v.raw))
        json[key] = typedValue.map(v => v.raw)
        obj[key] = { type, value: typedValue.map(v => v.display) }
      } else {
        const typedValue = this.valueByType(value, type, key)
        array.push(typedValue.raw)
        json[key] = typedValue.raw
        obj[key] = { type, value: typedValue.display }
      }
    })

    return { array, json, obj }
  }

  valueByType = (value, type, name) => {
    if (type === 'string') {
      return { display: value, raw: value }
    }

    if (type === 'bool') {
      if (!value || value === '0' || value === 'false' || value === 'False' || value === 'FALSE') {
        return { display: 'false', raw: false }
      }
      return { display: 'true', raw: true }
    }

    if (type.startsWith('bytes') || type === 'byte') {
      const bytes = utils.format.bytes(value)
      let length = bytes.length
      if (type === 'byte') {
        length = 1
      } else if (type.substr(5)) {
        length = Number(type.substr(5))
      }
      if (bytes.length > length) {
        throw new Error(t('contract.form.error.byteLength', { name, length, bytesLength: bytes.length }))
      }
      const arr = new Uint8Array(length)
      arr.set(bytes)
      return {
        display: `0x${Buffer.from(arr).toString('hex')}`,
        raw: arr,
      }
    }

    if (type.startsWith('int') || type.startsWith('uint')) {
      let number
      try {
        number = BigInt(value)
      } catch (e) {
        throw new Error(t('contract.form.error.notInteger', { name }))
      }
      if (type.startsWith('uint') && number < BigInt(0)) {
        throw new Error(t('contract.form.error.notUnsigned', { name }))
      }
      return { display: number.toString(), raw: number.toString() }
    }

    return { display: value, raw: value }
  }

  setArgValue = (value, index) => {
    const args = [...this.state.args]
    args[index] = value
    this.setState({ args })
  }

  renderActionInput = (type, index, disabled) => {
    const value = this.state.args[index]
    // const unit = units(type)
    const onChange = value => this.setArgValue(value, index)
    const props = { size: this.props.size, type, placeholder: type, value, onChange, disabled }

    if (type.startsWith('int') || type.startsWith('uint')) {
      return (
        <ActionParamInput {...props}>
          <b>123</b>
        </ActionParamInput>
      )
    }

    const icon = paramInputIcons[type]
    if (icon) {
      return (
        <ActionParamInput {...props}>
          <span key={icon}><i className={icon} /></span>
        </ActionParamInput>
      )
    }

    if (type.startsWith('bytes') || type === 'string') {
      return (
        <ActionParamInput {...props} textarea unit='UTF8'/>
      )
    } else if (icon) {
      return (
        <ActionParamInput {...props}>
          <span key={`icon-${index}`}><i className={icon} /></span>
        </ActionParamInput>
      )
    } else if (type.endsWith('[]')) {
      return (
        <ActionParamInput {...props}>
          <span key={`icon-${index}`}><i className='fas fa-brackets' /></span>
        </ActionParamInput>
      )
    }
    return type
  }

  render () {
    const { size, name: methodName, inputs = [], Empty, disabled } = this.props

    if (!inputs.length) {
      return Empty || null
    }

    return (
      <div>
        {inputs.map(({ name, type, value }, index) => (
          <FormGroup key={`${methodName}-${index}`} className={size === 'sm' && 'mb-2'}>
            <Label className={size === 'sm' && 'mb-1 small font-weight-bold'}>
              {name || `(param${index})`}
            </Label>
            {this.renderActionInput(type, index, disabled || !!value)}
          </FormGroup>
        ))}
      </div>
    )
  }
}
