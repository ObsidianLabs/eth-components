import React from 'react'

import {
  DropdownInput,
} from '@obsidians/ui-components'

import semver from 'semver'
import platform from '@obsidians/platform'
import fileOps from '@obsidians/file-ops'
import notification from '@obsidians/notification'

import { NewProjectModal } from '@obsidians/workspace'
import { DockerImageInputSelector } from '@obsidians/docker'
import compilerManager from '@obsidians/compiler'

const openZeppelinVersions = [
  { id: 'v4.1.0', display: 'v4.1.0' },
  { id: 'v4.0.0', display: 'v4.0.0' },
  { id: 'v3.4.0', display: 'v3.4.0' },
  { id: 'v3.3.0', display: 'v3.3.0' },
  { id: 'v3.2.0', display: 'v3.2.0' },
  { id: 'v3.1.0', display: 'v3.1.0' },
  { id: 'v3.0.2', display: 'v3.0.2' },
  { id: 'v2.5.1', display: 'v2.5.1' },
  { id: 'v2.4.0', display: 'v2.4.0' },
  { id: 'v2.3.0', display: 'v2.3.0' },
  { id: 'v2.2.0', display: 'v2.2.0' },
  // { id: 'v2.1.3', display: 'v2.1.3' },
  // { id: 'v2.0.0', display: 'v2.0.0' },
]

export default class ExtendedNewProjectModal extends NewProjectModal {
  constructor (props) {
    super(props)

    this.state = {
      ...this.state,
      compilerVersion: '',
      openZeppelinVersion: 'v4.1.0',
    }
  }

  async createProject ({ projectRoot, name, template, group }) {
    if (this.props.createProject) {
      const createProject = this.props.createProject.bind(this)
      return createProject({ projectRoot, name, template, group })
    }

    const { compilerVersion, openZeppelinVersion } = this.state
    if (!this.props.noCompilerOption && !compilerVersion) {
      notification.error('Cannot Create the Project', `Please install ${process.env.COMPILER_NAME_IN_LABEL} and select a version.`)
      return false
    }
    
    if (platform.isWeb) {
      return super.createProject({ projectRoot, name, template, compilerVersion })
    }

    if (group === 'open zeppelin') {
      this.setState({ showTerminal: true })

      const hasERC1155 = semver.gte(openZeppelinVersion, 'v3.1.0')
      if (!hasERC1155) {
        template = 'openzeppelin-no-erc1155'
      }
      let openZeppelinPackage = `@openzeppelin/contracts`
      if (semver.lt(openZeppelinVersion, '3.0.0')) {
        openZeppelinPackage = 'openzeppelin-solidity'
        template = 'openzeppelin-v2'
      } else if (semver.gte(openZeppelinVersion, '4.0.0')) {
        template = 'openzeppelin-v4'
      }

      await super.createProject({ projectRoot, name, template, compilerVersion })

      let result = await this.terminal.current.exec(`npm init -y`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Cannot Create the Project')
        return false
      }
      result = await this.terminal.current.exec(`npm i -S ${openZeppelinPackage}@${openZeppelinVersion}`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Cannot Create the Project')
        return false
      }

      return { projectRoot, name }
    }

    if (group === process.env.COMPILER_NAME) {
      this.setState({ showTerminal: true })
      const compilerVersion = this.state.compilerVersion
      if (!compilerVersion) {
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
        `${process.env.DOCKER_IMAGE_COMPILER}:${compilerVersion}`,
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
          [process.env.COMPILER_VERSION_KEY]: compilerVersion,
          solc: 'default'
        }
      }
      await fileOps.current.writeFile(fileOps.current.path.join(projectRoot, 'config.json'), JSON.stringify(config, null, 2))
      return { projectRoot, name }
    }

    return super.createProject({ projectRoot, name, template, compilerVersion })
  }

  renderOtherOptions = () => {
    if (this.props.noCompilerOption) {
      return null
    }
    return (
      <>
        {
          this.state.group === 'open zeppelin' &&
          <DropdownInput
            label='Open Zeppelin Version'
            options={openZeppelinVersions}
            value={this.state.openZeppelinVersion}
            onChange={openZeppelinVersion => this.setState({ openZeppelinVersion })}
          />
        }
        <DockerImageInputSelector
          channel={compilerManager.truffle}
          label={`${process.env.COMPILER_NAME_IN_LABEL} version`}
          noneName={`${process.env.COMPILER_NAME}`}
          modalTitle={`${process.env.COMPILER_NAME} Manager`}
          downloadingTitle={`Downloading ${process.env.COMPILER_NAME}`}
          selected={this.state.compilerVersion}
          onSelected={compilerVersion => this.setState({ compilerVersion })}
        />
      </>
    )
  }
}

const templates = [
  { id: 'empty', display: 'Empty Project' },
  { id: 'coin', display: 'Coin' },
]
if (platform.isDesktop) {
  templates.push({
    group: 'open zeppelin',
    badge: 'Open Zeppelin',
    children: [
      { id: 'openzeppelin', display: 'Open Zeppelin' },
    ],
  })
  templates.push({
    group: `${process.env.COMPILER_NAME}`,
    badge: `${process.env.COMPILER_NAME}`,
    children: [
      { id: 'metacoin', display: 'Metacoin' },
    ],
  })
}

ExtendedNewProjectModal.defaultProps = {
  defaultTemplate: 'coin',
  templates,
}
