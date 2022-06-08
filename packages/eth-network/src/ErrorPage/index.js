import React from 'react'
import { Button } from '@obsidians/ui-components'

export default function ErrorPage({ error, errorDesc, btnStatus = false, btnSize='md', btnColor = 'primary', btnText, handleBtn }) {

  return (
    <>
      <h4 className='display-4'>{error}</h4>
      <p className='lead'>{errorDesc}</p>
      <div hidden={btnStatus}>
        <Button size={btnSize} className='mt-4' color={btnColor} onClick={handleBtn}>
          {btnText}
        </Button>
      </div>
    </>
  )
}