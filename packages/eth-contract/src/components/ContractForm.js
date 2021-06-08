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

import { networkManager } from '@obsidians/eth-network'
import { KeypairInputSelector } from '@obsidians/keypair'

import { utils } from '@obsidians/sdk'

const optionItemFromValue = (value, type) => {
  let icon = null
  let label = value
  if (typeof value === 'object') {
    label = value.raw
    if (value.encoding === 'utf8') {
      // icon = <i className='fas fa-text mr-1'/>
    } else if (value.encoding === 'hex') {
      icon = <i className='fas fa-code mr-1'/>
    }
  }
  label = label.length > 10 ? `${label.substr(0, 8)}...` : label

  // if (format === 'file') {
  //   icon = <i className='fas fa-file mr-1' />
  //   label = fileOps.current.path.parse(value).base
  // } else 

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
        label: 'Add Item',
        options: [
          { label: 'Enter...', getValue: this.enterNewItem },
        ]
      }
    ]
  }

  enterNewItem = async () => {
    this.setState({ newValue: '', title: 'Enter a New Item' })
    this.modal.current.openModal()
    // setTimeout(() => this.input.current.focus(), 100)
    return new Promise(resolve=> this.onResolve = resolve)
  }

  onClickItem = async ({ value }) => {
    this.setState({ newValue: value, title: 'Modiry an Item' })
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
        >
          {addon}
        </ActionParamInput>
      </Modal>
    </>
  }
}

export function ActionParamInput ({ size, type, value, onChange, placeholder, disabled, textarea, children, maxLength = 128 }) {
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
        onChange={onChange}
      />
    )
  } else if (type.startsWith('int') || type.startsWith('uint')) {
    const value = props.value
    let invalid
    if (value) {
      invalid = value !== parseInt(value).toString()
      if (type.startsWith('uint') && value < 0) {
        invalid = true
      }
    }
    const feedback = type.startsWith('int') ? 'Invalid integer' : 'Invalid unsigned integer'

    return (
      <DebouncedInput
        size={size}
        addon={children}
        {...props}
        feedback={invalid && feedback}
        invalid={invalid}
      />
    )
  } else if (type === 'address') {
    delete props.placeholder
    return (
      <KeypairInputSelector
        size={size}
        editable
        maxLength={maxLength}
        icon='fas fa-map-marker-alt'
        extra={networkManager.browserExtension?.isEnabled && [{
          group: networkManager.browserExtension.name.toLowerCase(),
          badge: networkManager.browserExtension.name,
          children: networkManager.browserExtension?.allAccounts?.map(address => ({ address })) || []
        }]}
        {...props}
      />
    )
  } else if (type === 'string') {
    return (
      <div style={{ position: 'relative' }}>
        <DebouncedInput type='textarea' size={size} {...props} />
        <Badge style={{ position: 'absolute', right: '5px', bottom: '5px', height: '18px', zIndex: 100 }}>UTF8</Badge>
      </div>
    )
  } else if (textarea) {
    const { raw = '', encoding = 'utf8' } = value || {}
    const onChange = raw => props.onChange({ encoding, raw })
    let invalid, feedback
    if (encoding === 'hex') {
      invalid = raw && !/^0[xX][0-9a-fA-F]+$/.test(raw)
      feedback = invalid && 'Invalid hex string'
    }
    
    return (
      <div style={{ position: 'relative' }}>
        <DebouncedInput
          type='textarea'
          size={size}
          {...props}
          value={raw}
          onChange={onChange}
          feedback={feedback}
          invalid={invalid}
        >
          <Badge
            color={encoding === 'utf8' ? 'primary' : 'secondary'}
            style={{ position: 'absolute', right: '38px', bottom: '5px', height: '18px', zIndex: 100, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
            onClick={() => { props.onChange({ encoding: 'utf8', raw })}}
          >UTF8</Badge>
          <Badge
            color={encoding === 'hex' ? 'primary' : 'secondary'}
            style={{ position: 'absolute', right: '5px', bottom: '5px', height: '18px', zIndex: 100, borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            onClick={() => { props.onChange({ encoding: 'hex', raw })}}
          >HEX</Badge>
        </DebouncedInput>
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
    let empty = true

    this.props.inputs.forEach(({ name, type }, index) => {
      const value = this.state.args[index]
      const key = name || `(param${index})`
      if (!type) {
        if (value) {
          empty = false
        }
        array.push(value)
        json[key] = value.toString()
        obj[key] = { type, value }
      } else if (type.endsWith('[]')) {
        const typedValue = value
          ? value.map((item, i) => this.valueByType(item.value, type.replace('[]', ''), `${key}[${i}]`))
          : []
        if (typedValue.length) {
          empty = false
        }
        array.push(typedValue.map(v => v.raw))
        json[key] = typedValue.map(v => v.raw)
        obj[key] = { type, value: typedValue.map(v => v.display) }
      } else {
        const typedValue = this.valueByType(value, type, key)
        if (type.startsWith('int') || type.startsWith('uint')) {
          if (typedValue.raw !== '0') {
            empty = false
          }
        } else if (typedValue.raw) {
          empty = false
        }
        array.push(typedValue.raw)
        json[key] = typedValue.raw
        obj[key] = { type, value: typedValue.display }
      }
    })

    return { array, json, obj, empty }
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
      let bytes
      if (value.encoding === 'hex') {
        let hex = value.raw.toLowerCase()
        if (!hex.startsWith('0x')) {
          hex = '0x' + hex
        }
        try {
          bytes = utils.format.bytesFromHex(hex)
        } catch {
          throw new Error(`Not a valid hex string for parameter <b>${name}</b>.`)
        }
      } else {
        bytes = utils.format.bytes(value.raw)
      }

      let length = bytes.length
      if (type === 'byte') {
        length = 1
      } else if (type.substr(5)) {
        length = Number(type.substr(5))
      }
      if (bytes.length > length) {
        throw new Error(`Byte length overflow for parameter <b>${name}</b>. Expect ${length} but got ${bytes.length}.`)
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
        throw new Error(`The entered value of <b>${name}</b> is not an integer number.`)
      }
      if (type.startsWith('uint') && number < BigInt(0)) {
        throw new Error(`The entered value of <b>${name}</b> is not a unsigned integer.`)
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
      return <ActionParamInput {...props} textarea />
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
