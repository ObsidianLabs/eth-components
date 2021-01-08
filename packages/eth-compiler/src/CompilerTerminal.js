import React from 'react'

import Terminal from '@obsidians/terminal'

import compilerManager from './compilerManager'

export default function (props) {
  return (
    <Terminal
      {...props}
      ref={ref => (compilerManager.terminal = ref)}
      logId='compiler'
      input
    />
  )
}