import React, { PureComponent } from 'react'
import { utils } from '@obsidians/sdk'

export default class TransactionFee extends PureComponent {
  render () {
    const { value } = this.props
    const amount = utils.unit.fromValue(value)
    const gvalue = utils.unit.valueToGvalue(value)
    let fee = ''

    if (amount > 0.001) {
      fee = `${amount} ${process.env.TOKEN_SYMBOL}`
    } else if (gvalue > 0.001) {
      fee = `${gvalue} Gdrip`
    } else {
      fee = `${value} drip`
    }

    const id = `tooltip-fee-${value}-${Math.floor(Math.random() * 1000)}`
    return <>
      <span id={id} style={{ cursor: 'default', display: 'block', textAlign: 'right' }}>
        { fee }
      </span>
    </>
  }
}
