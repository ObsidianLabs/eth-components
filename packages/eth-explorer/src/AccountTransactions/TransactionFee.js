import React, { PureComponent } from 'react'
import { Badge } from '@obsidians/ui-components'
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
      fee = `${gvalue} Gwei`
    } else {
      fee = `${value} wei`
    }

    const id = `tooltip-fee-${value}-${Math.floor(Math.random() * 1000)}`
    return (
      <Badge pill>
        {fee}
      </Badge>
    )
  }
}
