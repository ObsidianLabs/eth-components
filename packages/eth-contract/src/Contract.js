import React from 'react'

import {
  TabbedExplorer,
  Screen,
  Button,
} from '@obsidians/ui-components'

import { withRouter } from 'react-router-dom'
import redux, { connect } from '@obsidians/redux'
import { namedContracts } from '@obsidians/sdk'

import ContractPage from './ContractPage'

class Contract extends TabbedExplorer {
  static defaultProps = {
    route: 'contract',
    Page: ContractPage,
    valueFormatter: value => value.toLowerCase(),
  }

  constructor (props) {
    super(props)
    props.cacheLifecycles.didRecover(this.checkLocation)
  }

  componentDidMount () {
    this.init()
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
    const { network, contracts } = this.props
    const value = contracts.getIn([network, 'selected'])
    const tabs = contracts.getIn([network, 'tabs'])?.toArray() || []
    this.initialize({ value, tabs, subroute: network })
  }

  checkLocation = () => {
    const value = this.props.match?.params?.value || ''
    return value && this.openTab(value)
  }

  render () {
    const { history, route, network, uiState, projects, contracts, valueFormatter } = this.props

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

    const starred = contracts.getIn([network, 'starred'])?.toArray() || []
    const projectRoot = projects.getIn(['selected', 'path'])
    const props = {
      starred,
      subroute: network,
      signer: uiState.get('signer'),
      projectRoot,
      getTabText: tab => {
        let { text, value = '' } = tab
        if (text) {
          return text
        }
        const address = valueFormatter(value)
        let tabText = ''
        if (namedContracts[address]) {
          tabText = namedContracts[address]
        } else if (address.length < 10) {
          tabText = address
        } else {
          tabText = `${address.substr(0, 6)}...${address.slice(-4)}`
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
])(withRouter(Contract))
