import React from 'react'

import {
  DebouncedInput,
} from '@obsidians/ui-components'

export default function BoolParamInput ({ size, value, onChange, placeholder, disabled }) {
  const onChangeValue = value => {
    if (!value) {
      onChange(value, { display: false, raw: false, empty: true })
    } else if (value === '0' || value === 'false' || value === 'False' || value === 'FALSE') {
      onChange(value, { display: false, raw: false })
    } else {
      onChange(value, { display: true, raw: true })
    }
  }

  React.useEffect(() => {
    onChangeValue(value)
  }, [])

  return (
    <DebouncedInput
      size={size}
      addon={<span key='icon-bool-param'><i className='fas fa-check' /></span>}
      value={value}
      onChange={onChangeValue}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
