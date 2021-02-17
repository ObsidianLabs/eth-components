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
      truffleVersion: '',
      openZeppelinVersion: 'v3.4.0',
    }
  }

  async createProject ({ projectRoot, name, template, group }) {
    if (platform.isWeb) {
      return super.createProject({ projectRoot, name, template })
    }

    if (group === 'open zeppelin') {
      this.setState({ showTerminal: true })
      await fileOps.current.ensureDirectory(projectRoot)
      const { truffleVersion, openZeppelinVersion } = this.state

      const hasERC1155 = semver.gte(openZeppelinVersion, 'v3.1.0')
      if (!hasERC1155) {
        template = 'openzeppelin-no-erc1155'
      }

      let result = await this.terminal.current.exec(`npm init -y`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Cannot Create the Project')
        return false
      }
      let openZeppelinPackage = `@openzeppelin/contracts`
      if (semver.lt(openZeppelinVersion, '3.0.0')) {
        openZeppelinPackage = 'openzeppelin-solidity'
        template = 'openzeppelin-v2'
      }
      result = await this.terminal.current.exec(`npm i -S ${openZeppelinPackage}@${openZeppelinVersion}`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Cannot Create the Project')
        return false
      }

      const config = {
        main: hasERC1155 ? './contracts/GameItems.sol' : './contracts/GLDToken.sol',
        deploy: hasERC1155 ? './build/contracts/GameItems.json' : './contracts/GLDToken.json',
        compilers: {
          [process.env.COMPILER_VERSION_KEY]: truffleVersion,
          solc: template === 'openzeppelin-v2' ? '0.5.17' : '0.6.12'
        }
      }
      await fileOps.current.writeFile(fileOps.current.path.join(projectRoot, 'config.json'), JSON.stringify(config, null, 2))

      await super.createProject({ projectRoot, name, template })
      return { projectRoot, name }
    }

    if (group === process.env.COMPILER_NAME) {
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
        `${process.env.DOCKER_IMAGE_COMPILER}:${truffleVersion}`,
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
    }

    return super.createProject({ projectRoot, name, template })
  }

  renderOtherOptions = () => {
    if (this.state.group === 'open zeppelin') {
      return (
        <>
          <DropdownInput
            label='Open Zeppelin Version'
            options={openZeppelinVersions}
            value={this.state.openZeppelinVersion}
            onChange={openZeppelinVersion => this.setState({ openZeppelinVersion })}
          />
          <DockerImageInputSelector
            channel={compilerManager.truffle}
            label={`${process.env.COMPILER_NAME_IN_LABEL} version`}
            noneName={`${process.env.COMPILER_NAME}`}
            modalTitle={`${process.env.COMPILER_NAME} Manager`}
            downloadingTitle={`Downloading ${process.env.COMPILER_NAME}`}
            selected={this.state.truffleVersion}
            onSelected={truffleVersion => this.setState({ truffleVersion })}
          />
        </>
      )
    }
    if (this.state.group === process.env.COMPILER_NAME) {
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
    return null
  }
}

ExtendedNewProjectModal.defaultProps = {
  defaultTemplate: 'coin',
  templates: [
    { id: 'coin', display: 'Coin' },
    {
      group: 'open zeppelin',
      badge: 'Open Zeppelin',
      children: [
        { id: 'openzeppelin', display: 'Open Zeppelin' },
      ],
    },
    {
      group: `${process.env.COMPILER_NAME}`,
      badge: `${process.env.COMPILER_NAME}`,
      children: [
        { id: 'metacoin', display: 'Metacoin' },
      ],
    },
  ]
}
