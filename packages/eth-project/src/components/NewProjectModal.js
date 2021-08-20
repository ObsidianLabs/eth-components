import React from 'react'
import classnames from 'classnames'

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

const frameworkNames = {
  truffle: 'Truffle',
  hardhat: 'Hardhat',
  waffle: 'Waffle',
  'truffle-docker': `Dockerized ${process.env.COMPILER_NAME}`,
}

const truffleVersions = [
  { id: 'v5.4.6', display: 'v5.4.6' },
  { id: 'v5.3.14', display: 'v5.3.13' },
  { id: 'v5.2.6', display: 'v5.2.6' },
  { id: 'v5.1.67', display: 'v5.1.67' },
  { id: 'v5.0.43', display: 'v5.0.43' },
  { id: 'v4.1.13', display: 'v4.1.13' },
]

const hardhatVersions = [
  { id: 'v2.5.0', display: 'v2.5.0' },
  { id: 'v2.4.3', display: 'v2.4.3' },
  { id: 'v2.3.3', display: 'v2.3.3' },
  { id: 'v2.2.1', display: 'v2.2.1' },
]

const waffleVersions = [
  { id: 'v3.4.0', display: 'v3.4.0' },
  { id: 'v3.3.0', display: 'v3.3.0' },
  { id: 'v3.2.2', display: 'v3.2.2' },
  { id: 'v3.1.2', display: 'v3.1.2' },
]

export default class ExtendedNewProjectModal extends NewProjectModal {
  constructor (props) {
    super(props)

    this.state = {
      ...this.state,
      framework: 'truffle',
      npmClient: 'npm',
      truffleVersion: 'v5.4.6',
      hardhatVersion: 'v2.5.0',
      waffleVersion: 'v3.4.0',
      truffleDockerVersion: '',
      openZeppelinVersion: 'v4.2.0',
    }
  }

  componentDidUpdate () {
    const { group, framework } = this.state
    if (group === 'Truffle' && framework !== 'truffle-docker') {
      this.setState({ framework: 'truffle-docker' })
    }
  }

  async createProject ({ projectRoot, name, template, group }) {
    if (this.props.createProject) {
      const createProject = this.props.createProject.bind(this)
      return createProject({ projectRoot, name, template, group })
    }

    const {
      framework,
      npmClient,
      truffleVersion,
      hardhatVersion,
      waffleVersion,
      truffleDockerVersion,
      openZeppelinVersion,
    } = this.state
    const compilerName = frameworkNames[framework]
    const compilerVersion = framework === 'truffle-docker' ? truffleDockerVersion : this.state[`${framework}Version`]

    if (this.state.remote) {
      return super.createProject({ projectRoot, name, template, framework, compilerVersion: truffleDockerVersion })
    }

    if (!this.props.noCompilerOption && !compilerVersion) {
      notification.error('Cannot Create the Project', `Please select a version for ${compilerName}.`)
      return false
    }

    if (group === process.env.COMPILER_NAME) {
      this.setState({ showTerminal: true })
      if (!truffleDockerVersion) {
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
        `${process.env.DOCKER_IMAGE_COMPILER}:${truffleDockerVersion}`,
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
          [process.env.COMPILER_VERSION_KEY]: truffleDockerVersion,
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

    let result = await super.createProject({ projectRoot, name, template, framework, compilerVersion, notify: false })
    if (!result) {
      return false
    }

    if (group === 'open zeppelin' || framework === 'truffle' || framework === 'hardhat' || framework === 'waffle') {
      this.setState({ showTerminal: true })
      const result = await this.terminal.current.exec(`${npmClient} init -y`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Cannot Create the Project', 'Please make sure you have node installed.')
        return false
      }
    }

    const installCommand = npmClient === 'yarn' ? 'add --dev' : 'i -D'
    if (group === 'open zeppelin') {
      const result = await this.terminal.current.exec(`${npmClient} ${installCommand} ${openZeppelinPackage}@${openZeppelinVersion}`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Fail to Install OpenZeppelin')
        return false
      }
    }
    if (framework === 'truffle') {
      const result = await this.terminal.current.exec(`${npmClient} ${installCommand} truffle@${truffleVersion}`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Fail to Install Truffle')
        return false
      }
    } else if (framework === 'hardhat') {
      const result = await this.terminal.current.exec(`${npmClient} ${installCommand} hardhat@${hardhatVersion} @nomiclabs/hardhat-waffle ethereum-waffle chai @nomiclabs/hardhat-ethers ethers`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Fail to Install Hardhat')
        return false
      }
    } else if (framework === 'waffle') {
      const result = await this.terminal.current.exec(`${npmClient} ${installCommand} ethereum-waffle@${waffleVersion} ethers`, { cwd: projectRoot })
      if (result.code) {
        notification.error('Fail to Install Waffle')
        return false
      }
    }
    result = await super.createProject({ name, projectRoot, framework }, 'post')
    if (!result) {
      return false
    }
    return { projectRoot, name }
  }

  renderTemplate (renderSuper) {
    if (renderSuper) {
      return super.renderTemplate()
    }
    return null
  }

  renderFrameworkSelector = () => {
    const { framework, truffleVersion, hardhatVersion, waffleVersion, truffleDockerVersion } = this.state
    if (framework === 'truffle') {
      return (
        <DropdownInput
          label='Truffle Version'
          options={truffleVersions}
          value={truffleVersion}
          onChange={truffleVersion => this.setState({ truffleVersion })}
        />
      )
    } else if (framework === 'hardhat') {
      return (
        <DropdownInput
          label='Hardhat Version'
          options={hardhatVersions}
          value={hardhatVersion}
          onChange={hardhatVersion => this.setState({ hardhatVersion })}
        />
      )
    } else if (framework === 'waffle') {
      return (
        <DropdownInput
          label='Waffle Version'
          options={waffleVersions}
          value={waffleVersion}
          onChange={waffleVersion => this.setState({ waffleVersion })}
        />
      )
    } else if (framework === 'truffle-docker') {
      return (
        <DockerImageInputSelector
          key='truffle-selector'
          channel={compilerManager.truffle}
          label={`${process.env.COMPILER_NAME_IN_LABEL} version`}
          noneName={`${process.env.COMPILER_NAME}`}
          modalTitle={`${process.env.COMPILER_NAME} Manager`}
          downloadingTitle={`Downloading ${process.env.COMPILER_NAME}`}
          selected={truffleDockerVersion}
          onSelected={truffleDockerVersion => this.setState({ truffleDockerVersion })}
        />
      )
    }
    return null
  }
 
  renderOtherOptions = () => {
    const { remote, group, openZeppelinVersion, framework, npmClient } = this.state
    if (this.props.noCompilerOption || remote) {
      return null
    }

    const options = [{ key: 'truffle-docker', text: frameworkNames['truffle-docker'] }]
    if (group !== 'Truffle') {
      options.unshift({ key: 'waffle', text: frameworkNames.waffle })
      options.unshift({ key: 'hardhat', text: frameworkNames.hardhat })
      options.unshift({ key: 'truffle', text: frameworkNames.truffle })
    }

    return (
      <>
        <div className='row'>
          <div className={classnames(group === 'open zeppelin' ? 'col-12 col-sm-8' : 'col-12')}>
            {this.renderTemplate(true)}
          </div>
          {
            group === 'open zeppelin' &&
            <div className='col-12 col-sm-4'>
              <DropdownInput
                label='Open Zeppelin Version'
                options={openZeppelinVersions}
                value={openZeppelinVersion}
                onChange={openZeppelinVersion => this.setState({ openZeppelinVersion })}
              />
          </div>
          }
        </div>
        <div className='row'>
          <div className='col-12 col-sm-8'>
            <FormGroup>
              <Label>Framework</Label>
              <div>
                <ButtonOptions
                  className='mb-0'
                  options={options}
                  selected={framework}
                  onSelect={framework => this.setState({ framework })}
                />
              </div>
            </FormGroup>
          </div>
          <div className='col-12 col-sm-4'>
            {this.renderFrameworkSelector()}
          </div>
        </div>
        {
            (group === 'open zeppelin' || framework !== 'truffle-docker') &&
            <FormGroup>
              <Label>Npm Client</Label>
              <div>
                <ButtonOptions
                  className='mb-0'
                  options={[
                    { key: 'npm', text: 'npm' },
                    { key: 'yarn', text: 'yarn' },
                    { key: 'cnpm', text: 'cnpm' },
                  ]}
                  selected={npmClient}
                  onSelect={npmClient => this.setState({ npmClient })}
                />
              </div>
            </FormGroup>
          }
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
