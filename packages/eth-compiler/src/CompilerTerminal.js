import React, { PureComponent } from 'react'

import {
  Tabs,
  TabContent,
  TabPane,
} from '@obsidians/ui-components'

import Terminal from '@obsidians/terminal'

import compilerManager from './compilerManager'
import TruffleTerminal from './TruffleTerminal'

const initialTabs = [
  { key: 'project', text: <span key='compiler-project'><i className='fas fa-folder-open mr-1' />Project</span> },
  { key: 'truffle', text: <span key='compiler-truffle'><i className='fas fa-cookie mr-1' />Truffle</span> }
]

export default class CompilerTerminal extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      activeTab: 'project'
    }

    compilerManager.switchCompilerConsole = this.switchCompilerConsole.bind(this)
    this.tabs = React.createRef()
  }

  switchCompilerConsole = key => {
    const tab = initialTabs.find(tab => tab.key === key)
    this.tabs.current.currentTab = tab
  }

  render () {
    const { active, cwd } = this.props
    const { activeTab } = this.state
  
    return (
      <Tabs
        ref={this.tabs}
        size='sm'
        headerClassName='nav-tabs-dark-active'
        noCloseTab
        initialSelected='project'
        initialTabs={initialTabs}
        onSelectTab={tab => this.setState({ activeTab: tab.key })}
      >
        <TabContent className='h-100 w-100' activeTab={activeTab}>
          <TabPane className='h-100 w-100' tabId='project'>
            <Terminal
              ref={ref => (compilerManager.terminal = ref)}
              active={active && activeTab === 'project'}
              cwd={cwd}
              logId='compiler-project'
              input
            />
          </TabPane>
          <TabPane className='h-100 w-100' tabId='truffle'>
            <TruffleTerminal
              active={active && activeTab === 'truffle'}
              cwd={cwd}
            />
          </TabPane>
        </TabContent>
      </Tabs>
    )
  
  }
}