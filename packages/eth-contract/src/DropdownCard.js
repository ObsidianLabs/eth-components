import React, { Component } from 'react'
import {
  Card,
  Button,
  Collapse
} from 'reactstrap'

export default class DropdownCard extends Component {
  constructor (props) {
    super(props)
    this.state = {
      isOpen: !!props.isOpen
    }
  }

  render () {
    const {
      title,
      right,
      // rightColor = 'primary',
      children,
      flex = 'none',
      minHeight,
      maxHeight,
      overflow,
    } = this.props

    return <>
      <div
        className='btn-secondary d-flex align-items-center justify-content-between border-0 rounded-0 px-1 py-0'
        style={{ flex: 'none', height: '28px' }}
        onClick={() => this.setState({ isOpen: !this.state.isOpen })}
      >
        <div>
          <span className='w-3' style={{ display: 'inline-block' }} key={`collapse-parameters-${this.state.isOpen}`}>
            { this.state.isOpen ? <i className='fas fa-caret-down' /> : <i className='fal fa-caret-right' />}
          </span>
          {title}
        </div>
        <div className='d-flex'>{right}</div>
      </div>
      <Collapse
        isOpen={this.state.isOpen}
        style={{ flex, minHeight, maxHeight }}
      >
        <Card body className='py-2'>
          {children}
        </Card>
      </Collapse>
    </>
  }
}
