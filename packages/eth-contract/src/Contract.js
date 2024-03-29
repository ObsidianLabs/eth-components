import React from 'react'
import { utils } from '@obsidians/sdk'

import {
  TabbedExplorer,
  Screen,
  Button,
} from '@obsidians/ui-components'

import { withRouter } from 'react-router-dom'
import redux, { connect } from '@obsidians/redux'
import { networkManager } from '@obsidians/eth-network'
import { t } from '@obsidians/i18n'

import ContractPage from './ContractPage'

class Contract extends TabbedExplorer {
  static defaultProps = {
    route: 'contract',
    Page: ContractPage,
    valueFormatter: value => value.toLowerCase(),
  }

  constructor(props) {
    super(props)
    props.cacheLifecycles.didRecover(this.checkLocation)
    this.contextMenu = [
      {
        text: 'Close',
        onClick: this.closeCurrent
      },
      {
        text: 'Close Others',
        onClick: this.closeOthers
      }
    ]
  }

  componentDidMount() {
    this.init()
  }

  componentDidUpdate(props) {
    if (this.props.network !== props.network) {
      this.init()
    }

    if (this.props.match?.params?.value !== props.match?.params?.value) {
      this.checkLocation()
    }
  }

  closeCurrent = (current) => {
    const { onCloseTab } = this.tabs.current.tabs.current
    onCloseTab(current)
  }

  closeOthers = (currentTab) => {
    const { onCloseTab, allTabs } = this.tabs.current.tabs.current
    const shouldCloseTabs = allTabs.filter(tab => tab.key !== currentTab.key)

    shouldCloseTabs.forEach(tab => {
      onCloseTab(tab)
    })
  }

  init = () => {
    const { history, route, network, contracts, match } = this.props
    const value = match?.params?.value?.toLowerCase() || contracts.getIn([network, 'selected'])?.toLowerCase()
    if (match?.params) {
      history.push(value ? `/${route}/${value}` : `/${route}`)
    }
    const tabs = contracts.getIn([network, 'tabs'])?.toArray() || []
    this.initialize({ value, tabs, subroute: network })
  }

  checkLocation = () => {
    const value = this.props.match?.params?.value || ''
    return value && this.openTab(value)
  }

  render() {
    const { history, route, network, uiState, projects, contracts, tokens, valueFormatter } = this.props

    if (network === 'dev' && !uiState.get('localNetwork')) {
      return (
        <Screen>
          <h4 className='display-4'>{t('network.network.noNetwork')}</h4>
          <p className='lead'>{t('network.network.noNetworkText')}</p>
          <hr />
          <span>
            <Button color='primary' onClick={() => history.push(`/network/${network}`)}>{t('network.network.gotoNetwork')}</Button>
          </span>
        </Screen>
      )
    }

    const starred = contracts.getIn([network, 'starred'])?.toArray() || []
    const projectRoot = projects.getIn(['selected', 'pathname'])
    const props = {
      starred,
      subroute: network,
      signer: uiState.get('signer'),
      tabContextMenu: this.contextMenu,
      projectRoot,
      getTabText: tab => {
        let { text, value = '' } = tab
        if (text) {
          return text
        }
        const address = valueFormatter(value)
        const addressEthers = utils.formatAddress(address)

        let tabText = ''
        const tokenInfo = tokens?.getIn([network, address])?.toJS()
        if (networkManager.sdk?.namedContracts[address]) {
          tabText = (
            <div key={`token-${address}`} className='d-flex flex-row align-items-center'>
              <i className='fas fa-file-invoice text-muted mr-1' />
              {networkManager.sdk?.namedContracts[address]}
            </div>
          )
        } else if (tokenInfo) {
          const icon = tokenInfo.icon
            ? <img src={tokenInfo.icon} className='token-icon-xs mr-1' />
            : <i className='fas fa-coin text-muted mr-1' />
          tabText = (
            <div key={`token-${address}`} className='d-flex flex-row align-items-center'>
              {icon}
              {tokenInfo.symbol}
            </div>
          )
        } else if (address.length < 10) {
          tabText = <code>{address}</code>
        } else {
          tabText = <code>{ utils.abbreviateAddress(address) }</code>
        }
        return tabText
      },
      onValueUpdate: value => {
        redux.dispatch('SELECT_CONTRACT', { network, account: value })
        history.push(`/${route}/${value}`)
      },
      onTabsUpdate: tabs => {
        redux.dispatch('SET_CONTRACT_TABS', { network, tabs })
      },
      onStarredUpdate: starred => {
        redux.dispatch('SET_STARRED_CONTRACTS', { network, starred })
      }
    }

    return super.render(props)
  }
}

export default connect([
  'uiState',
  'network',
  'projects',
  'contracts',
  'tokens',
])(withRouter(Contract))

export {
  Contract as BaseContract
}
