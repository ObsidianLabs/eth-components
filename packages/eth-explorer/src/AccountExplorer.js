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
import FaucetButton from './buttons/FaucetButton'

class AccountExplorer extends TabbedExplorer {
  static defaultProps = {
    route: 'account',
    Page: AccountPage,
    valueFormatter: value => value.toLowerCase(),
    ToolbarButtons: ({ explorer, value, ...otherProps }) => <>
      <TransferButton from={value} {...otherProps} />
      <FaucetButton address={value} {...otherProps} />
    </>,
  }

  constructor (props) {
    super(props)
    this.keypairs = {}
    props.cacheLifecycles.didRecover(this.checkLocation)
  }

  componentDidMount () {
    this.init()
    keypairManager.loadAllKeypairs().then(this.updateKeypairs)
    keypairManager.onUpdated(this.updateKeypairs)
  }

  componentDidUpdate (props) {
    if (this.props.network !== props.network) {
      this.init()
    }

    if (this.props.match?.params?.value !== props.match?.params?.value) {
      this.checkLocation()
    }
  }

  init = () => {
    const { network, accounts } = this.props
    const value = accounts.getIn([network, 'selected'])
    const tabs = accounts.getIn([network, 'tabs'])?.toArray() || []
    this.initialize({ value, tabs, subroute: network })
  }

  checkLocation = () => {
    const value = this.props.match?.params?.value || ''
    return value && this.openTab(value)
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
      signer: uiState.get('signer'),
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
