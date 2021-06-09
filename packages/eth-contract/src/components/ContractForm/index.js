import React, { PureComponent } from 'react'


import ActionParamFormGroup from './ActionParamFormGroup'

export default class ContractForm extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      params: props.inputs?.map(({ value }) => ({ value: value || '' })) || []
    }
  }

  componentDidMount () {
    if (this.props.params) {
      this.setState({ params: [...this.props.params] })
    }
  }

  componentWillReceiveProps (props) {
    if (props.inputs !== this.props.inputs) {
      this.setState({
        params: props.inputs?.map(({ value }) => ({ value: value || '' })) || []
      })
    }
  }

  getParameters = () => {
    const array = []
    const json = {}
    const obj = {}
    let allEmpty = true

    this.props.inputs.forEach(({ name, type }, index) => {
      const param = this.state.params[index]
      const key = name || `(param${index})`
      if (!type) {
        if (param.value) {
          allEmpty = false
        }
        array.push(param.value)
        json[key] = param.value.toString()
        obj[key] = { value: param.value }
      } else {
        const { error, raw, display, empty } = param
        if (error) {
          throw error
        }
        if (!empty) {
          allEmpty = false
        }
        
        array.push(raw)
        json[key] = raw
        obj[key] = { type, value: display }
      }
    })

    return { array, json, obj, empty: allEmpty }
  }

  setParamValue = index => (value, extra) => {
    this.state.params[index] = { value, ...extra }
    const params = [...this.state.params]
    this.setState({ params })
  }

  render () {
    const { size, name: methodName, inputs = [], Empty, disabled } = this.props

    if (!inputs.length) {
      return Empty || null
    }

    return (
      <div>
        {inputs.map(({ name, type, components, value }, index) => (
          <ActionParamFormGroup
            key={`${methodName}-${index}`}
            size={size}
            label={name || `(param${index})`}
            type={type}
            components={components}
            value={this.state.params[index].value}
            onChange={this.setParamValue(index)}
            disabled={disabled || !!value}
          />
        ))}
      </div>
    )
  }
}
