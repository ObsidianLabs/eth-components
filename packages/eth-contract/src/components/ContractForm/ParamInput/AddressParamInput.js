import React from 'react'
import { networkManager } from '@obsidians/eth-network'
import { KeypairInputSelector } from '@obsidians/keypair'

export default function AddressParamInput ({ size, value, onChange, disabled, maxLength = 128, type }) {
  const onChangeValue = (value = '') => {
    value && type === 'address' && (value = value.replace(/[^0-9a-zA-Z$]/ig, ""))
    onChange(value, { raw: value, display: value, empty: !value })
  }

  React.useEffect(() => {
    onChangeValue(value)
  }, [])

  const mataMaskAccount = networkManager?.browserExtension?.currentAccount || ''

  return (
    <KeypairInputSelector
      size={size}
      editable
      maxLength={maxLength}
      icon='fas fa-map-marker-alt'
      extra={networkManager.browserExtension?.isEnabled && mataMaskAccount && [{
        group: networkManager.browserExtension.name.toLowerCase(),
        badge: networkManager.browserExtension.name,
        children: [{ address: mataMaskAccount, name: networkManager.browserExtension.name }]
      }]}
      value={value}
      onChange={onChangeValue}
      disabled={disabled}
      abbreviationOption
    />
  )
}
