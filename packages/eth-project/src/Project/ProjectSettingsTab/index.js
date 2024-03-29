import React from 'react'

import {
  DebouncedFormGroup,
  FormGroup,
  Label,
  CustomInput,
  Input,
} from '@obsidians/ui-components'

import {
  WorkspaceContext,
  BaseProjectManager,
  AbstractProjectSettingsTab,
  ProjectPath,
} from '@obsidians/workspace'

import notification from '@obsidians/notification'
import { DockerImageInputSelector } from '@obsidians/docker'
import compilerManager from '@obsidians/compiler'

import NewProjectModal from '../../components/NewProjectModal'
import { t } from '@obsidians/i18n'
import debounce from 'lodash/debounce'
import openzeppelinReleases from '../../openzeppelinReleases.json'

export default class ProjectSettingsTab extends AbstractProjectSettingsTab {
  static contextType = WorkspaceContext

  componentDidMount() {
    BaseProjectManager.channel.on('settings', this.debouncedUpdate)
  }

  componentWillUnmount() {
    BaseProjectManager.channel.off('settings', this.debouncedUpdate)
  }

  changeChecked = () => this.onChange('formatSolidity')(!this.context.projectSettings?.get('formatSolidity'))

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

  render() {
    const { noSolc } = this.props
    const { projectRoot, projectManager, projectSettings } = this.context
    const framework = projectSettings?.get('framework')
    const readOnly = !projectManager.userOwnProject && projectManager.remote
    const frameworks = Object.entries(NewProjectModal.defaultProps.FrameworkSelector.frameworkNames)
      .map(([key, name]) => ({ key, name }))

    return (
      <div className='custom-tab bg2'>
        <div className='jumbotron bg-transparent text-body'>
          <div className='container'>
            <h1>{t('project.projectSetting')}</h1>
            <form disabled={true}>
              <ProjectPath projectRoot={projectRoot} remote={projectManager.remote} />

              <h4 className='mt-4'>{t('project.general')}</h4>
              {this.renderLanguageOption(projectSettings)}
              <DebouncedFormGroup
                label='Main file'
                className='bg-black'
                value={projectSettings?.get('main')}
                onChange={this.onChange('main')}
                placeholder={`Required`}
                readOnly={readOnly}
              />
              <DebouncedFormGroup
                label='Smart contract to deploy'
                className='bg-black'
                value={projectSettings?.get('deploy')}
                onChange={this.onChange('deploy')}
                placeholder={`Path to the built contract to deploy`}
                readOnly={readOnly}
              />
              {
                !projectManager.remote &&
                <FormGroup>
                  <Label>{t('framework')}</Label>
                  <CustomInput
                    id='settings-framework'
                    type='select'
                    className='bg-black'
                    value={framework}
                    onChange={event => {
                      notification.warning('Warning', 'Change framework is not recommended. The project may fail to compile and deploy unless you know how to set it up properly.')
                      this.onChange('framework')(event.target.value)
                    }}
                  >
                    {frameworks.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
                  </CustomInput>
                </FormGroup>
              }
              {
                !framework.endsWith('-docker') &&
                <FormGroup>
                  <Label>Npm {t('client')}</Label>
                  <CustomInput
                    id='settings-npm-client'
                    type='select'
                    className='bg-black'
                    value={projectSettings?.get('npmClient')}
                    onChange={event => this.onChange('npmClient')(event.target.value)}
                    disabled={readOnly}
                  >
                    <option value='npm'>npm</option>
                    <option value='yarn'>yarn</option>
                    <option value='cnpm'>cnpm</option>
                  </CustomInput>
                </FormGroup>
              }
              <h4 className='mt-4'>{t('project.compilers')}</h4>
              {
                !projectManager.remote && framework === 'truffle' &&
                <DockerImageInputSelector
                  channel={compilerManager.truffle}
                  disableAutoSelection
                  bg='bg-black'
                  label={`${process.env.COMPILER_NAME_IN_LABEL} version`}
                  noneName={`${process.env.COMPILER_NAME}`}
                  modalTitle={`${process.env.COMPILER_NAME} Manager`}
                  downloadingTitle={`Downloading ${process.env.COMPILER_NAME}`}
                  selected={projectSettings?.get(`compilers.${process.env.COMPILER_VERSION_KEY}`)}
                  readOnly={readOnly}
                  onSelected={truffle => this.onChange(`compilers.${process.env.COMPILER_VERSION_KEY}`)(truffle)}
                />
              }
              {
                !noSolc &&
                <DockerImageInputSelector
                  channel={compilerManager.solc}
                  disableAutoSelection
                  bg='bg-black'
                  label='Solc version'
                  noManager
                  extraOptions={!projectManager.remote && framework === 'truffle' && [{
                    id: 'default',
                    display: 'From truffle-config.js',
                    onClick: () => this.onChange('compilers.solc')('default'),
                  }]}
                  selected={projectSettings?.get('compilers.solc')}
                  onSelected={solc => this.onChange('compilers.solc')(solc)}
                  readOnly={readOnly}
                />
              }
              <FormGroup>
                <Label>EVM {t('project.version')}</Label>
                <CustomInput
                  id='settings-evm-version'
                  type='select'
                  className='bg-black'
                  value={projectSettings?.get('compilers.evmVersion')}
                  onChange={event => this.onChange('compilers.evmVersion')(event.target.value)}
                  disabled={readOnly}
                >
                  <option value='berlin'>Berlin</option>
                  <option value='istanbul'>Istanbul</option>
                  <option value='petersburg'>Petersburg</option>
                  <option value='constantinople'>Constantinople</option>
                  <option value='byzantium'>Byzantium</option>
                  <option value='spuriousDragon'>Spurious Dragon</option>
                  <option value='tangerineWhistle'>Tangerine Whistle</option>
                  <option value='homestead'>Homestead</option>
                </CustomInput>
              </FormGroup>
              <DebouncedFormGroup
                label='Optimizer runs'
                className='bg-black'
                placeholder='Default: 0 (disabled)'
                value={projectSettings?.get('compilers.optimizer.runs') || ''}
                readOnly={readOnly}
                onChange={value => {
                  const runs = Number(value)
                  if (runs) {
                    this.onChange('compilers.optimizer')({ enabled: true, runs })
                  } else {
                    this.onChange('compilers.optimizer')({ enabled: false })
                  }
                }}
              />
              <h4 className='mt-4'>Solidity</h4>
              <FormGroup className='actionConfirm__checkbox'>
                <div className='ml-4'>
                  <Input type='checkbox' id='format-solidity-check-box'
                    disabled={readOnly}
                    onChange={debounce(this.changeChecked, 200)}
                    checked={projectSettings?.get('formatSolidity')} />
                  <Label check htmlFor='format-solidity-check-box'>{t('project.formatSolidity')}</Label>
                </div>
              </FormGroup>
              <FormGroup>
                <Label>Linter</Label>
                <CustomInput
                  id='settings-linter'
                  type='select'
                  className='bg-black'
                  value={projectSettings?.get('linter')}
                  onChange={event => this.onChange('linter')(event.target.value)}
                  disabled={readOnly}
                >
                  <option value='solhint'>Solhint</option>
                  <option value='solium'>Solium/Ethlint</option>
                </CustomInput>
              </FormGroup>

              {
                projectManager.remote && <>
                  <h4 className='mt-4'>Openzeppelin</h4>
                  <FormGroup>
                    <Label>Import Option</Label>
                    <CustomInput
                      id='settings-openzeppelin-import-option'
                      type='select'
                      className='bg-black'
                      value={projectSettings?.get('openzeppelin.importOption')}
                      onChange={event => this.onChange('openzeppelin.importOption')(event.target.value)}
                      disabled
                    >
                      <option value='http_url'>HTTP URL</option>
                      <option value='npm_install'>NPM Install</option>
                    </CustomInput>
                  </FormGroup>
                  <FormGroup>
                    <Label>{t('project.version')}</Label>
                    <CustomInput
                      id='settings-openzeppelin-version'
                      type='select'
                      className='bg-black'
                      value={projectSettings?.get('openzeppelin.version')}
                      onChange={event => this.onChange('openzeppelin.version')(event.target.value)}
                      disabled={readOnly}
                    >
                      {
                        Object.keys(openzeppelinReleases).map(item => <option value={item}>{item}</option>)
                      }
                    </CustomInput>
                  </FormGroup>
                </>
              }

              <h4 className='mt-4'>{t('project.editor')}</h4>
              <FormGroup>
                <Label>{t('project.fontFamily')}</Label>
                <CustomInput
                  id='settings-font-family'
                  type='select'
                  className='bg-black'
                  value={projectSettings?.get('editor.fontFamily')}
                  onChange={event => this.onChange('editor.fontFamily')(event.target.value)}
                  disabled={readOnly}
                >
                  <option value='Hack'>Hack</option>
                  <option value='Fira Code'>Fira Code</option>
                </CustomInput>
              </FormGroup>
              <FormGroup>
                <Label>{t('project.fontSize')}</Label>
                <CustomInput
                  id='settings-font-size'
                  type='select'
                  className='bg-black'
                  value={projectSettings?.get('editor.fontSize')}
                  onChange={event => this.onChange('editor.fontSize')(event.target.value)}
                  disabled={readOnly}
                >
                  <option value='11px'>11px</option>
                  <option value='12px'>12px</option>
                  <option value='13px'>13px</option>
                  <option value='14px'>14px</option>
                  <option value='15px'>15px</option>
                  <option value='16px'>16px</option>
                </CustomInput>
              </FormGroup>
              <FormGroup>
                <Label>{t('project.fontLigatures')}</Label>
                <CustomInput
                  id='settings-ligatures'
                  type='select'
                  className='bg-black'
                  value={projectSettings?.get('editor.ligatures')}
                  onChange={event => this.onChange('editor.ligatures')(event.target.value === 'true')}
                  disabled={readOnly}
                >
                  <option value='false'>Disabled</option>
                  <option value='true'>Enabled</option>
                </CustomInput>
              </FormGroup>

              <AbstractProjectSettingsTab.DeleteButton context={this.context} />
            </form>
          </div>
        </div>
      </div>
    )
  }
}
