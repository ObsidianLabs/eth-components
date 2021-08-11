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
    ToolbarButtons: ({ value, ...otherProps }) => <>
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
    const { history, route, network, accounts, match } = this.props
    const value = accounts.getIn([network, 'selected'])
    if (match?.params && value !== match?.params?.value) {
      history.push(value ? `/${route}/${value}` : `/${route}`)
    }
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
    const { history, route, network, uiState, accounts, tokens, valueFormatter } = this.props

    if (network === 'dev' && !uiState.get('localNetwork')) {
      return (
        <Screen>
          <h4 className='display-4'>No Network</h4>
          <p className='lead'>No connected network. Please start a local network or switch to a remote network.</p>
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
        let { text, value = '' } = tab
        if (text) {
          return text
        }
        const address = valueFormatter(value)
        let tabText = ''
        const tokenInfo = tokens?.getIn([network, address])?.toJS()
        if (this.keypairs[address]) {
          tabText = <>
            <i className='fas fa-map-marker-alt text-muted mr-1' />
            {this.keypairs[address]}
          </>
        } else if (tokenInfo) {
          const icon = tokenInfo.icon
            ? <img src={tokenInfo.icon} className='token-icon-xs mr-1'/>
            : <i className='fas fa-coin text-muted mr-1' />
          tabText = <>
            {icon}
            {tokenInfo.symbol}
          </>
        } else if (address.length < 10) {
          tabText = <code>{address}</code>
        } else {
          tabText = <code>{address.substr(0, 6)}...{address.slice(-4)}</code>
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
  'tokens',
])(withRouter(AccountExplorer))
