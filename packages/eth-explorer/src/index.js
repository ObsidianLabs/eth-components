import React, { PureComponent } from 'react'

import {
  TabsWithNavigationBar,
} from '@obsidians/ui-components'

import keypairManager from '@obsidians/keypair'

import CacheRoute from 'react-router-cache-route'

import AccountPage from './AccountPage'

import TransferButton from './buttons/TransferButton'
import FaucetButton from './buttons/FaucetButton'

export default class Explorer extends PureComponent {
  constructor (props) {
    super(props)

    let selectedTabKey = ''
    const initialTabs = props.tabs.map((value, index) => {
      const key = `tab-${index}`
      if (value === props.address) {
        selectedTabKey = key
      }
      return { key, value }
    })
    let initialSelected
    if (!selectedTabKey) {
      initialSelected = { key: `tab-${initialTabs.length}`, value: props.address }
      initialTabs.push(initialSelected)
    } else {
      initialSelected = { key: selectedTabKey, value: props.address }
    }

    this.state = {
      initialSelected,
      initialTabs,
      value: props.address,
    }

    this.tabs = React.createRef()
    this.accountPage = React.createRef()
    this.keypairs = {}
  }

  componentDidMount () {
    keypairManager.loadAllKeypairs().then(this.updateKeypairs)
    keypairManager.onUpdated(this.updateKeypairs)
  }

  updateKeypairs = keypairs => {
    this.keypairs = {}
    keypairs.forEach(k => {
      this.keypairs[k.address] = k.name
    })
    this.forceUpdate()
  }

  get currentValue () {
    return this.state.value
  }

  openTab = value => {
    this.tabs.current && this.tabs.current.openTab(value)
  }

  onValue = value => {
    this.setState({ value })
    this.props.onValueChanged && this.props.onValueChanged(value)
  }

  onPageDisplay = page => {
    this.currentPage = page
  }

  onRefresh = () => {
    this.currentPage?.refresh()
  }

  getTabText = tab => {
    const { value, temp } = tab
    let tabText = ''
    if (this.keypairs[value]) {
      tabText = this.keypairs[value]
    } else if (value.length < 10) {
      tabText = value
    } else {
      tabText = `${value.substr(0, 6)}...${value.slice(-4)}`
    }
    return tabText
  }

  render () {
    const { network } = this.props
    const { initialSelected, initialTabs, value } = this.state

    return <>
      <TabsWithNavigationBar
        ref={this.tabs}
        initialSelected={initialSelected}
        initialTabs={initialTabs}
        starred={this.props.starred}
        maxTabWidth={46}
        getTabText={this.getTabText}
        onValue={this.onValue}
        onChangeStarred={this.props.onChangeStarred}
        onRefresh={this.onRefresh}
        onTabsUpdated={this.props.onTabsUpdated}
        NavbarButtons={(
          this.props.network === 'testnet' && <FaucetButton address={value} network={this.props.network} />
        )}
      >
        <CacheRoute
          path={`/account/:name`}
          cacheKey={props => `account-${network}-${props.match?.params?.name}`}
          multiple={5}
          className='h-100 overflow-auto'
          render={props => (
            <AccountPage
              cacheLifecycles={props.cacheLifecycles}
              onDisplay={this.onPageDisplay}
              value={props.match.params.name}
            />
          )}
        />
      </TabsWithNavigationBar>
    </>
  }
}
