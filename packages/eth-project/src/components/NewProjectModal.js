import React from 'react'

import {
  FormGroup,
  Label,
  ButtonOptions,
  DropdownInput,
} from '@obsidians/ui-components'

import semver from 'semver'
import fileOps from '@obsidians/file-ops'
import notification from '@obsidians/notification'

import { NewProjectModal } from '@obsidians/workspace'
import { DockerImageInputSelector } from '@obsidians/docker'
import compilerManager from '@obsidians/compiler'

const openZeppelinVersions = [
  { id: 'v4.2.0', display: 'v4.2.0' },
  { id: 'v4.1.0', display: 'v4.1.0' },
  { id: 'v4.0.0', display: 'v4.0.0' },
  { id: 'v3.4.1', display: 'v3.4.1' },
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

const hardhatVersions = [
  { id: 'v2.5.0', display: 'v2.5.0' },
  { id: 'v2.4.3', display: 'v2.4.3' },
  { id: 'v2.3.3', display: 'v2.3.3' },
  { id: 'v2.2.1', display: 'v2.2.1' },
]

export default class ExtendedNewProjectModal extends NewProjectModal {
  constructor (props) {
    super(props)

    this.state = {
      ...this.state,
      framework: 'truffle',
      truffleVersion: '',
      hardhatVersion: 'v2.5.0',
      openZeppelinVersion: 'v4.2.0',
    }
  }

  componentDidUpdate () {
    const { group, framework } = this.state
    if (group === 'Truffle' && framework !== 'truffle') {
      this.setState({ framework: 'truffle' })
    }
  }

  async createProject ({ projectRoot, name, template, group }) {
    if (this.props.createProject) {
      const createProject = this.props.createProject.bind(this)
      return createProject({ projectRoot, name, template, group })
    }

    const { framework, truffleVersion, hardhatVersion, openZeppelinVersion } = this.state
    const compilerVersion = framework === 'truffle' ? truffleVersion : hardhatVersion
    const compilerName = framework === 'truffle' ? process.env.COMPILER_NAME_IN_LABEL : 'hardhat'
    
    if (this.state.remote) {
      return super.createProject({ projectRoot, name, template, framework, compilerVersion })
    }

    if (!this.props.noCompilerOption && !compilerVersion) {
      notification.error('Cannot Create the Project', `Please install ${compilerName} and select a version.`)
      return false
    }

    if (group === process.env.COMPILER_NAME) {
      this.setState({ showTerminal: true })
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
        framework: 'truffle',
        compilers: {
          [process.env.COMPILER_VERSION_KEY]: truffleVersion,
          solc: 'default'
        }
      }
      await fileOps.current.writeFile(fileOps.current.path.join(projectRoot, 'config.json'), JSON.stringify(config, null, 2))
      return { projectRoot, name }
    }

    let openZeppelinPackage
    if (group === 'open zeppelin') {
      openZeppelinPackage = `@openzeppelin/contracts`
      if (template === 'openzeppelin') {
        const hasERC1155 = semver.gte(openZeppelinVersion, 'v3.1.0')
        if (!hasERC1155) {
          template = 'openzeppelin-no-erc1155'
        }
        if (semver.lt(openZeppelinVersion, '3.0.0')) {
          openZeppelinPackage = 'openzeppelin-solidity'
          template = 'openzeppelin-v2'
        } else if (semver.gte(openZeppelinVersion, '4.0.0')) {
          template = 'openzeppelin-v4'
        }
      }
    }

    await super.createProject({ projectRoot, name, template, framework, compilerVersion })

    if (group === 'open zeppelin' || framework === 'hardhat') {
      this.setState({ showTerminal: true })
      const result = await this.terminal.current.exec(`npm init -y`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Cannot Create the Project', 'Please make sure you have node installed.')
        return false
      }
    }

    if (group === 'open zeppelin') {
      const result = await this.terminal.current.exec(`npm i -S ${openZeppelinPackage}@${openZeppelinVersion}`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Fail to Install OpenZeppelin')
        return false
      }
    }
    if (framework === 'hardhat') {
      const result = await this.terminal.current.exec(`npm i -save-dev hardhat@${hardhatVersion}`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Fail to Install Hardhat')
        return false
      }
    }

    return { projectRoot, name }
  }

  renderFrameworkSelector = () => {
    if (this.state.framework === 'truffle') {
      return (
        <DockerImageInputSelector
          key='truffle-selector'
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

    return (
      <DropdownInput
        label='Hardhat Version'
        options={hardhatVersions}
        value={this.state.hardhatVersion}
        onChange={hardhatVersion => this.setState({ hardhatVersion })}
      />
    )
  }
 
  renderOtherOptions = () => {
    if (this.props.noCompilerOption || this.state.remote) {
      return null
    }

    const options = [{ key: 'truffle', text: process.env.COMPILER_NAME }]
    if (this.state.group !== 'Truffle') {
      options.push({ key: 'hardhat', text: 'Hardhat' })
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
        <FormGroup>
          <Label>Framework</Label>
          <div>
            <ButtonOptions
              size='sm'
              className='mb-0'
              options={options}
              selected={this.state.framework}
              onSelect={key => this.setState({ framework: key })}
            />
          </div>
        </FormGroup>
        {this.renderFrameworkSelector()}
      </>
    )
  }
}

const templates = [
  { id: 'empty', display: 'Empty Project' },
  { id: 'coin', display: 'Coin' },
  { id: 'erc20', display: 'ERC20 Token' },
  {
    group: 'open zeppelin',
    badge: 'Open Zeppelin',
    local: true,
    children: [
      { id: 'openzeppelin', display: 'Basics - ERC20, ERC721 & ERC1155 (v3.1+)' },
    ],
  },
  {
    group: `${process.env.COMPILER_NAME}`,
    badge: `${process.env.COMPILER_NAME}`,
    local: true,
    children: [
      { id: 'metacoin', display: 'Metacoin' },
    ],
  }
]

ExtendedNewProjectModal.defaultProps = {
  defaultTemplate: 'coin',
  templates,
}
