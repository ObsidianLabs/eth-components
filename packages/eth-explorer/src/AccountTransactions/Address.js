import React, { useState } from 'react'
import { UncontrolledTooltip } from '@obsidians/ui-components'

import { Link } from 'react-router-dom'

const formatAddress = address => <code>{address.substr(0, 10)}...{address.substr(address.length - 6, address.length)}</code>
const accountAddress = address => `/account/${address}`

export default function Address ({ addr, redirect = true, displayText, showTooltip = true }) {
  const [id] = useState(`tooltip-address-${addr}-${Math.floor(Math.random() * 1000)}`)
  
  if (!addr) {
    return null
  }
  const hash = displayText ? displayText : formatAddress(addr)
  const url = accountAddress(addr)
  let text
  if (redirect) {
    text = (
      <Link to={url} className='text-body small' id={id}>
        {hash}
      </Link>
    )
  } else {
    text = (
      <span className='text-body small' id={id} style={{ cursor: 'default' }}>
        {hash}
      </span>
    )
  }
  return <>
    <div>{text}</div>
    {
      showTooltip &&
      <UncontrolledTooltip trigger='hover' delay={0} target={id} key={id}>
        { addr }
      </UncontrolledTooltip>
    }
  </>
}
