import React, { PureComponent } from 'react'

import {
  Tabs,
  TabContent,
  TabPane,
} from '@obsidians/ui-components'

import platform from '@obsidians/platform'
import Terminal from '@obsidians/terminal'

import { CompilerManager } from './compilerManager'
import TruffleTerminal from './TruffleTerminal'

const initialTabs = []
if (platform.isDesktop) {
  initialTabs.push({ key: 'terminal', text: <span key='compiler-terminal'><i className='fas fa-folder-open mr-1' />Project</span> })
  if (process.env.PROJECT === 'eth') {
    // initialTabs.push({ key: 'truffle', text: <span key='compiler-truffle'><i className='fas fa-cookie mr-1' />Truffle</span> })
  }
} else {
  initialTabs.push({ key: 'terminal', text: <span key='compiler-terminal'><i className='fas fa-hammer mr-1' />Compiler</span> })
}

export default class CompilerTerminal extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      activeTab: 'terminal'
    }

    CompilerManager.switchCompilerConsole = this.switchCompilerConsole.bind(this)
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
        initialSelected='terminal'
        initialTabs={initialTabs}
        onSelectTab={tab => this.setState({ activeTab: tab.key })}
      >
        <TabContent className='h-100 w-100' activeTab={activeTab}>
          <TabPane className='h-100 w-100' tabId='terminal'>
            <Terminal
              ref={ref => (CompilerManager.terminal = ref)}
              active={active && activeTab === 'terminal'}
              cwd={cwd}
              logId='compiler-terminal'
              input={platform.isDesktop}
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