import React, { PureComponent } from 'react'
import {
  Button,
  ListGroup,
} from '@obsidians/ui-components'

import fileOps from '@obsidians/file-ops'
import { ListItemDocker, ListItemDockerImage } from '@obsidians/docker'

import { instanceChannel } from '@obsidians/eth-network'
import compiler from '@obsidians/eth-compiler'

import checkDependencies from './checkDependencies'

export default class Welcome extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      ready: false
    }
    this.listItemDocker = React.createRef()
    this.listItemNode = React.createRef()
    this.listItemCompiler = React.createRef()
  }

  componentDidMount () {
    this.mounted = true
    this.refresh()
    fileOps.current.onFocus(this.refresh)
  }

  componentWillUnmount () {
    this.mounted = false
    fileOps.current.offFocus(this.refresh)
  }

  refresh = async () => {
    if (this.mounted) {
      this.listItemDocker.current.refresh()
      this.listItemNode.current.refresh()
      this.listItemCompiler.current.refresh()
      const ready = await checkDependencies()
      this.setState({ ready })
    }
  }

  render () {
    return (
      <div className='d-flex h-100 overflow-auto'>
        <div className='jumbotron jumbotron-fluid'>
          <div className='container'>
            <h4 className='display-4'>Welcome to {process.env.PROJECT_NAME}</h4>

            <p className='lead'>{process.env.PROJECT_NAME} is a graphic IDE for developing smart contracts on the {process.env.CHAIN_NAME} blockchain.
            To get started, please install the prerequisite tools for {process.env.CHAIN_NAME}.</p>

            <div className='my-3' />

            <ListGroup>
              <ListItemDocker
                ref={this.listItemDocker}
                onStartedDocker={this.refresh}
              />
              <ListItemDockerImage
                ref={this.listItemNode}
                channel={instanceChannel.node}
                title={`${process.env.CHAIN_NAME} Node in Docker`}
                subtitle={`${process.env.CHAIN_NAME} node built into a docker image.`}
                link={`https://hub.docker.com/r/${process.env.DOCKER_IMAGE_NODE}`}
                onInstalled={this.refresh}
                downloadingTitle={`Downloading ${process.env.CHAIN_NAME}`}
              />
              <ListItemDockerImage
                ref={this.listItemCompiler}
                channel={compiler.truffle}
                title={`${process.env.COMPILER_NAME} in Docker`}
                subtitle={`A ${process.env.CHAIN_NAME} version of truffle used to create and compile a project.`}
                link={`https://hub.docker.com/r/${process.env.DOCKER_IMAGE_TRUFFLE}`}
                onInstalled={this.refresh}
                downloadingTitle={`Downloading ${process.env.COMPILER_NAME}`}
              />
            </ListGroup>
            <Button
              block
              color={this.state.ready ? 'primary' : 'secondary'}
              size='lg'
              className='my-5 mx-auto'
              style={{ width: 'fit-content' }}
              onClick={this.props.onGetStarted}
            >
              {this.state.ready ? 'Get Started' : 'Skip'}
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
