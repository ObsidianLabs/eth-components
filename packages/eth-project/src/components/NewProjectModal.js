import React from 'react'

import platform from '@obsidians/platform'
import fileOps from '@obsidians/file-ops'
import notification from '@obsidians/notification'

import { NewProjectModal } from '@obsidians/workspace'
import { DockerImageInputSelector } from '@obsidians/docker'
import compilerManager from '@obsidians/eth-compiler'

export default class ExtendedNewProjectModal extends NewProjectModal {
  constructor (props) {
    super(props)

    this.state = {
      ...this.state,
      truffleVersion: '',
    }
  }

  async createProject ({ projectRoot, name, template }) {
    if (platform.isDesktop && template === 'metacoin') {
      this.setState({ showTerminal: true })
      const truffleVersion = this.state.truffleVersion
      if (!truffleVersion) {
        notification.error('Cannot Create the Project', `Please select a version for ${process.env.COMPILER_NAME}.`)
        return false
      }
      await fileOps.current.ensureDirectory(projectRoot)
      const projectDir = fileOps.current.getDockerMountPath(projectRoot)
      const cmd = [
        `docker run --rm -it`,
        `--name ${process.env.PROJECT}-create-project`,
        `-v "${projectDir}:/project/${name}"`,
        `-w "/project/${name}"`,
        `${process.env.DOCKER_IMAGE_TRUFFLE}:${truffleVersion}`,
        `${process.env.COMPILER_EXECUTABLE_NAME} unbox ${template}`,
      ].join(' ')

      const result = await this.terminal.current.exec(cmd)

      if (result.code) {
        notification.error('Cannot Create the Project')
        return false
      }

      const config = {
        main: './contracts/MetaCoin.sol',
        deploy: './build/contracts/MetaCoin.json',
        compilers: {
          [process.env.COMPILER_VERSION_KEY]: truffleVersion,
          solc: 'default'
        }
      }
      await fileOps.current.writeFile(fileOps.current.path.join(projectRoot, 'config.json'), JSON.stringify(config, null, 2))
      return { projectRoot, name }
    } else {
      return super.createProject({ projectRoot, name, template })
    }
  }

  renderOtherOptions = () => {
    if (this.state.template !== 'metacoin') {
      return null
    }
    return (
      <DockerImageInputSelector
        channel={compilerManager.truffle}
        label={`${process.env.COMPILER_NAME_IN_LABEL} version`}
        noneName={`${process.env.COMPILER_NAME}`}
        modalTitle={`${process.env.COMPILER_NAME} Manager`}
        downloadingTitle={`Downloading ${process.env.COMPILER_NAME}`}
        selected={this.state.truffleVersion}
        onSelected={truffleVersion => this.setState({ truffleVersion })}
      />
    )
  }
}

ExtendedNewProjectModal.defaultProps = {
  defaultTemplate: 'coin',
  templates: [
    { id: 'coin', display: 'Coin' },
    {
      group: `${process.env.COMPILER_NAME}`,
      badge: `${process.env.COMPILER_NAME}`,
      children: [
        { id: 'metacoin', display: 'Metacoin' },
      ],
    },
  ]
}
