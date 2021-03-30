import React, { PureComponent } from 'react'

import {
  Tabs,
  TabContent,
  TabPane,
} from '@obsidians/ui-components'

import Terminal from '@obsidians/terminal'

import nodeManager from './nodeManager'

const parser = /block:\s(\d+),/
function parseLine(line) {
  const match = parser.exec(line)
  if (match && match[1]) {
    nodeManager.updateBlockNumber(match[1])
  }
  return line
}

let incompleteLine = ''
function onLogReceived(message) {
  message = incompleteLine + message

  let lines = message.split('\n')
  incompleteLine = lines.pop()
  lines.push('')
  lines = lines.map(parseLine)
  return lines.join('\n')
}

export default class NodeTerminal extends PureComponent {
  constructor (props) {
    super(props)
    
    this.state = {
      activeTab: props.miner ? 'miner' : 'node',
    }
    this.tabs = React.createRef()
  }

  componentDidUpdate (prevProps) {
    if (this.props.miner === prevProps.miner) {
      return
    }
    if (this.props.miner) {
      this.openMinerTab()
    } else {
      this.closeMinerTab()
    }
  }

  openMinerTab = () => {
    this.tabs.current.setState({
      tabs: [
        { key: 'node', text: <span key='terminal-node'><i className='fas fa-server mr-1' />node</span> },
        { key: 'miner', text: <span key='terminal-miner'><i className='fas fa-hammer mr-1' />miner</span> },
      ]
    })
    setTimeout(() => this.tabs.current.onCloseTab({ key: 'node' }), 100)
  }
  closeMinerTab = () => {
    this.tabs.current.setState({
      tabs: [
        { key: 'node', text: <span key='terminal-node'><i className='fas fa-server mr-1' />node</span> },
        { key: 'miner', text: <span key='terminal-miner'><i className='fas fa-hammer mr-1' />miner</span> },
      ]
    })
    setTimeout(() => this.tabs.current.onCloseTab({ key: 'miner' }), 100)
  }

  clearTerminal = () => {
    nodeManager.terminal.clearContent()
  }

  render () {
    const { active, miner } = this.props
    const { activeTab } = this.state

    let initialTabs = [
      { key: 'node', text: <span key='terminal-node'><i className='fas fa-server mr-1' />node</span> },
    ]
    if (miner) {
      initialTabs = [{ key: 'miner', text: <span key='terminal-miner'><i className='fas fa-hammer mr-1' />miner</span> }]
    }
  
    return (
      <Tabs
        ref={this.tabs}
        headerClassName='nav-tabs-dark-active'
        noCloseTab
        initialSelected='node'
        initialTabs={initialTabs}
        onSelectTab={tab => this.setState({ activeTab: tab.key })}
        ToolButtons={[{ icon: 'far fa-trash-alt', tooltip: 'Clear', onClick: this.clearTerminal }]}
      >
        <TabContent className='h-100 w-100' activeTab={activeTab}>
          <TabPane className='h-100 w-100' tabId='node'>
            <Terminal
              logId='node-instance'
              active={active && activeTab === 'node'}
              ref={ref => (nodeManager.terminal = ref)}
              onLogReceived={onLogReceived}
            />
          </TabPane>
          <TabPane className='h-100 w-100' tabId='miner'>
            <Terminal
              logId='node-miner'
              active={active && activeTab === 'miner'}
              ref={ref => (nodeManager.minerTerminal = ref)}
              onLogReceived={onLogReceived}
            />
          </TabPane>
        </TabContent>
      </Tabs>
    )
  }
}