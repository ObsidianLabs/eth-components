import React, { PureComponent } from 'react'
import {
  Button,
  ListGroup,
} from '@obsidians/ui-components'

import fileOps from '@obsidians/file-ops'
import { ListItemDocker, ListItemDockerImage } from '@obsidians/docker'

import { instanceChannel } from '@obsidians/eth-network'
import compiler from '@obsidians/eth-compiler'
import { t } from '@obsidians/i18n'

import checkDependencies from './checkDependencies'

export default class Welcome extends PureComponent {
  static defaultProps = {
    nodeSubtitle: `${process.env.CHAIN_NAME} node built into a docker image.`,
    truffleSubtitle: `${process.env.CHAIN_NAME} version of truffle used to create and compile a project.`,
  }

  constructor (props) {
    super(props)
    this.state = {
      ready: false
    }
    this.listItemDocker = React.createRef()
    this.imageRefs = new Array(2 + (props.extraItems?.length || 0))
      .fill(null)
      .map(() => React.createRef())
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

  getImageItems = (props = this.props) => {
    const { extraItems = [] } = props
    return [
      {
        channel: instanceChannel.node,
        title: `${process.env.CHAIN_EXECUTABLE_NAME} in Docker`,
        subtitle: props.nodeSubtitle,
        link: `https://hub.docker.com/r/${process.env.DOCKER_IMAGE_NODE}`,
        downloadingTitle: `Downloading ${process.env.CHAIN_EXECUTABLE_NAME}`,
      },
      {
        channel: compiler.truffle,
        title: `${process.env.COMPILER_NAME} in Docker`,
        subtitle: props.truffleSubtitle,
        link: `https://hub.docker.com/r/${process.env.DOCKER_IMAGE_COMPILER}`,
        downloadingTitle: `Downloading ${process.env.COMPILER_NAME}`,
      },
      ...extraItems,
    ]
  }

  refresh = async () => {
    if (this.mounted) {
      this.listItemDocker.current.refresh()
      this.imageRefs.forEach(ref => ref.current?.refresh())
      const ready = await checkDependencies(this.props.extraItems)
      this.setState({ ready })
    }
  }

  render () {
    return (
      <div className='d-flex h-100 overflow-auto'>
        <div className='jumbotron jumbotron-fluid'>
          <div className='container'>
            <h4 className='display-4'>{t('welcome.welcome', { projectName: process.env.PROJECT_NAME })}</h4>

            <p className='lead'>{t('welcome.message', { projectName: process.env.PROJECT_NAME, chainName: process.env.CHAIN_NAME })}</p>

            <div className='my-3' />

            <ListGroup>
              <ListItemDocker
                ref={this.listItemDocker}
                onStartedDocker={this.refresh}
              />
              {this.getImageItems().map((item, i) => (
                <ListItemDockerImage
                  key={`docker-image-${i}`}
                  ref={this.imageRefs[i]}
                  channel={item.channel}
                  title={item.title}
                  subtitle={item.subtitle}
                  link={item.link}
                  downloadingTitle={item.downloadingTitle}
                  onInstalled={this.refresh}
                />
              ))}
            </ListGroup>
            <Button
              block
              color={this.state.ready ? 'primary' : 'secondary'}
              size='lg'
              className='my-5 mx-auto'
              style={{ width: 'fit-content' }}
              onClick={this.props.onGetStarted}
            >
              {this.state.ready ? t('welcome.start') : t('welcome.skip')}
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
