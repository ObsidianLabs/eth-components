import React from 'react'

import {
  TabbedExplorer,
  Screen,
  Button,
} from '@obsidians/ui-components'

import { withRouter } from 'react-router-dom'
import redux, { connect } from '@obsidians/redux'
import keypairManager from '@obsidians/keypair'

import AccountPage from './AccountPage'

import TransferButton from './buttons/TransferButton'
import ConvertButton from './buttons/ConvertButton'
import FaucetButton from './buttons/FaucetButton'

class AccountExplorer extends TabbedExplorer {
  static defaultProps = {
    route: 'account',
    Page: AccountPage,
    valueFormatter: value => value.toLowerCase(),
    ToolbarButtons: ({ explorer, value, ...otherProps }) => <>
      <TransferButton from={value} {...otherProps} />
      <ConvertButton
        address={value}
        {...otherProps}
        onChange={value => {
          this.tabs.current?.updateTab({ value })
          this.onValue(value)
        }}
      />
      <FaucetButton address={value} {...otherProps} />
    </>,
  }

  constructor (props) {
    super(props)
    this.keypairs = {}
    props.cacheLifecycles.didRecover(this.checkLocation)
  }

  componentDidMount () {
    const { network, accounts } = this.props
    const value = accounts.getIn([network, 'selected'])
    const tabs = accounts.getIn([network, 'tabs'])?.toArray() || []
    this.initialize({ value, tabs })

    keypairManager.loadAllKeypairs().then(this.updateKeypairs)
    keypairManager.onUpdated(this.updateKeypairs)
  }

  componentDidUpdate () {
    this.checkLocation()
  }

  checkLocation = () => {
    const name = this.props.match?.params?.name || ''
    return name && this.page.current?.openTab(name)
  }

  updateKeypairs = keypairs => {
    this.keypairs = {}
    keypairs.forEach(k => this.keypairs[k.address] = k.name)
    this.forceUpdate()
  }

  render () {
    const { history, route, network, uiState, accounts, valueFormatter } = this.props

    if (network === 'dev' && !uiState.get('localNetwork')) {
      return (
        <Screen>
          <h4 className='display-4'>Disconnected</h4>
          <p className='lead'>Please start an {process.env.CHAIN_NAME} node.</p>
          <hr />
          <span>
            <Button color='primary' onClick={() => history.push(`/network/${network}`)}>Go to Network</Button>
          </span>
        </Screen>
      )
    }

    const starred = accounts.getIn([network, 'accounts'])?.toArray() || []
    const props = {
      starred,
      subroute: network,
      getTabText: tab => {
        let { value = '', temp } = tab
        const address = valueFormatter(value)
        let tabText = ''
        if (this.keypairs[address]) {
          tabText = this.keypairs[address]
        } else if (address.length < 10) {
          tabText = address
        } else {
          tabText = `${address.substr(0, 6)}...${address.slice(-4)}`
        }
        return tabText
      },
      onValueUpdate: value => {
        redux.dispatch('SELECT_ACCOUNT', { network, account: value })
        history.push(`/${route}/${value}`)
      },
      onTabsUpdate: tabs => {
        redux.dispatch('SET_ACCOUNT_TABS', { network, tabs })
      },
      onStarredUpdate: starred => {
        redux.dispatch('SET_STARRED', { network, starred })
      }
    }

    return super.render(props)
  }
}

export default connect([
  'uiState',
  'network',
  'accounts',
])(withRouter(AccountExplorer))