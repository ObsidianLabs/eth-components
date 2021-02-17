import React from 'react'

import {
  DebouncedFormGroup,
  FormGroup,
  Label,
  CustomInput,
} from '@obsidians/ui-components'

import {
  WorkspaceContext,
  BaseProjectManager,
  AbstractProjectSettingsTab,
  ProjectPath,
} from '@obsidians/workspace'

import platform from '@obsidians/platform'
import { DockerImageInputSelector } from '@obsidians/docker'
import compilerManager from '@obsidians/compiler'

export default class ProjectSettingsTab extends AbstractProjectSettingsTab {
  static contextType = WorkspaceContext

  componentDidMount () {
    BaseProjectManager.channel.on('settings', this.debouncedUpdate)
  }
  
  componentWillUnmount () {
    BaseProjectManager.channel.off('settings', this.debouncedUpdate)
  }

  renderLanguageOption = projectSettings => {
    if (!this.props.languages?.length) {
      return null
    }

    return (
      <FormGroup>
        <Label>Project language</Label>
        <CustomInput
          id='settings-language'
          type='select'
          className='bg-black'
          value={projectSettings?.get('language')}
          onChange={event => this.onChange('language')(event.target.value)}
        >
          {this.props.languages.map(item => <option key={item.key} value={item.key}>{item.text}</option>)}
        </CustomInput>
      </FormGroup>
    )
  }

  render () {
    const { projectRoot, projectSettings } = this.context

    return (
      <div className='custom-tab bg2'>
        <div className='jumbotron bg-transparent text-body'>
          <div className='container'>
            <h1>Project Settings</h1>
            <ProjectPath projectRoot={projectRoot} />

            <h4 className='mt-4'>General</h4>
            {this.renderLanguageOption(projectSettings)}
            <DebouncedFormGroup
              label='Main file'
              className='bg-black'
              value={projectSettings?.get('main')}
              onChange={this.onChange('main')}
              placeholder={`Required`}
            />
            <DebouncedFormGroup
              label='Smart contract to deploy'
              className='bg-black'
              value={projectSettings?.get('deploy')}
              onChange={this.onChange('deploy')}
              placeholder={`Required`}
            />
            <h4 className='mt-4'>Compilers</h4>
            {
              platform.isDesktop &&
              <DockerImageInputSelector
                channel={compilerManager.truffle}
                disableAutoSelection
                bg='bg-black'
                label={`${process.env.COMPILER_NAME_IN_LABEL} version`}
                noneName={`${process.env.COMPILER_NAME}`}
                modalTitle={`${process.env.COMPILER_NAME} Manager`}
                downloadingTitle={`Downloading ${process.env.COMPILER_NAME}`}
                selected={projectSettings?.get(`compilers.${process.env.COMPILER_VERSION_KEY}`)}
                onSelected={truffle => this.onChange(`compilers.${process.env.COMPILER_VERSION_KEY}`)(truffle)}
              />
            }
            <DockerImageInputSelector
              channel={compilerManager.solc}
              disableAutoSelection
              bg='bg-black'
              label='Solc version'
              noneName='solc'
              modalTitle='Solc Manager'
              downloadingTitle='Downloading Solc'
              extraOptions={platform.isDesktop && [{
                id: 'default',
                display: 'Default Solc',
                onClick: () => this.onChange('compilers.solc')('default')
              }]}
              selected={projectSettings?.get('compilers.solc')}
              onSelected={solc => this.onChange('compilers.solc')(solc)}
            />
            <AbstractProjectSettingsTab.DeleteButton context={this.context} />
          </div>
        </div>
      </div>
    )
  }
}
