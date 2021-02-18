import React, { PureComponent } from 'react'

import {
  TabsWithNavigationBar,
} from '@obsidians/ui-components'

import CacheRoute from 'react-router-cache-route'
import { namedContracts } from '@obsidians/sdk'

import ContractPage from './ContractPage'

export default class Contract extends PureComponent {
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
  }

  get currentValue () {
    return this.state.value
  }

  openTab = value => {
    if (!this.props.noLowerCaseTransform) {
      value = value.toLowerCase()
    }
    this.tabs.current?.openTab(value)
  }

  onValue = value => {
    if (!this.props.noLowerCaseTransform && value !== value.toLowerCase()) {
      value = value.toLowerCase()
      this.tabs.current?.updateTab({ value })
    }
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
    const { value = '', temp } = tab
    const address = this.props.noLowerCaseTransform ? value : value.toLowerCase()
    let tabText = ''
    if (namedContracts[address]) {
      tabText = namedContracts[address]
    } else if (value.length < 10) {
      tabText += value
    } else {
      tabText += (value.substr(0, 6) + '...' + value.slice(-4))
    }
    return tabText
  }

  render () {
    const { network, signer } = this.props
    const { initialSelected, initialTabs } = this.state

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
      >
        <CacheRoute
          path={`/contract/:name`}
          cacheKey={props => `contract-${network}-${props.match?.params?.name}`}
          multiple={5}
          className='h-100 overflow-auto'
          render={props => (
            <ContractPage
              cacheLifecycles={props.cacheLifecycles}
              onDisplay={this.onPageDisplay}
              value={props.match.params.name}
              signer={signer}
            />
          )}
        />
      </TabsWithNavigationBar>
    </>
  }
}
