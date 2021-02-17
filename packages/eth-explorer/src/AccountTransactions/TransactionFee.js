import React from 'react'
import { Badge } from '@obsidians/ui-components'
import { utils } from '@obsidians/sdk'

export default props => {
  return <Badge pill>{utils.display(props.value)}</Badge>
}
