import { ethers } from 'ethers'
import Big from 'big.js'

import txOptions from './txOptions'

const display = value => {
  const amount = ethers.utils.formatEther(value)
  if (amount > 0.001) {
    return `${new Intl.NumberFormat().format(amount)} ETH`
  } else if (amount > 0.0000000001) {
    const gvalue = ethers.utils.formatUnits(value, 'gwei')
    return `${new Intl.NumberFormat().format(gvalue)} Gwei`
  } else {
    return `${new Intl.NumberFormat().format(value)} wei`
  }
}

const utf8 = hex => {
  try {
    return ethers.utils.toUtf8String(hex)
  } catch {
    return
  }
}

const parseObject = (values, abi) => {
  const parsedOutputs = abi.map((param, index) => {
    const value = values[index]
    const { name, type, internalType } = param
    const parsed = parseValue(value, param, index)
    const result = { type, internalType, value: parsed }
    return [name || `(${index})`, result]
  })
  return Object.fromEntries(parsedOutputs)
}

const parseValue = (value, param) => {
  const { type, internalType, components } = param
  if (type === 'tuple') {
    return parseObject(value, components)
  } else if (type.endsWith(']')) {
    const itemParam = {
      type: type.replace(/\[\d*\]/, ''),
      internalType: internalType.replace(/\[\d*\]/, ''),
      components,
    }
    return value.map(v => {
      const parsed = parseValue(v, itemParam)
      return { value: parsed, type: itemParam.type, internalType: itemParam.internalType }
    })
  } else if (type.startsWith('uint') || type.startsWith('int')) {
    return value.toString()
  } else if (type.startsWith('byte')) {
    return { hex: value, utf8: utf8(value) }
  }
  return value
}

export default {
  txOptions,
  isValidAddress: address => ethers.utils.isAddress(address),
  sign: {
    sha3: ethers.utils.keccak256
  },
  format: {
    big: value => Big(value),
    bytes: str => ethers.utils.toUtf8Bytes(str),
    utf8,
    bytesFromHex: hex => ethers.utils.arrayify(hex),
  },
  unit: {
    fromValue: ethers.utils.formatEther,
    toValue: ethers.utils.parseEther,
    valueToGvalue: v => ethers.utils.formatUnits(v, 'gwei')
  },
  display,
  decodeError: () => '',
  parseError: e => {
    e.reason = ''
    try {
      const body = e.body || e.error.body || e.error.error.body
      const res = JSON.parse(body)
      e.reason = res.error.message
    } catch {}
    return e
  },
  parseObject,
  parseValue,
}