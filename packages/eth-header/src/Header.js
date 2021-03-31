import React, { PureComponent } from 'react'

import redux from '@obsidians/redux'
import Navbar from '@obsidians/navbar'
import keypairManager from '@obsidians/keypair'
import { NewProjectModal, navbarItem } from '@obsidians/eth-project'
import { networkManager } from '@obsidians/eth-network'

import headerActions from './headerActions'

export default class Header extends PureComponent {
  constructor (props) {
    super(props)
    this.state = {
      keypairs: []
    }
  }

  componentDidMount () {
    keypairManager.loadAllKeypairs().then(this.updateKeypairs)
    keypairManager.onUpdated(this.updateKeypairs)
  }

  updateKeypairs = keypairs => this.setState({ keypairs })

  render () {
    const {
      profile,
      projects,
      selectedProject,
      starred = [],
      starredContracts = starred,
      browserAccounts = [],
      extraContractItems,
      selectedContract,
      selectedAccount,
      network,
      networkList,
    } = this.props

    const username = profile.get('username') || 'local'
    const navbarLeft = [
      navbarItem(projects, selectedProject, username)
    ]

    const contractIcon = isSelected => isSelected ? 'fas fa-file-invoice' : 'far fa-file'
    const addressIcon = isSelected => isSelected ? 'fas fa-map-marker-alt' : 'far fa-map-marker'

    const dropdownKeypairs = this.state.keypairs.map(k => {
      const address = k.address
      return {
        id: address,
        name: k.name || <code className='small'>{address.substr(0, 10)}...{address.substr(-8)}</code>,
        icon: addressIcon,
      }
    })
    if (!dropdownKeypairs.length) {
      dropdownKeypairs.push({ none: true })
    }
    dropdownKeypairs.unshift({ header: 'keypair manager' })

    const dropdownBrowserAccounts = browserAccounts.map(item => {
      const name = this.state.keypairs.find(k => k.address === item)?.name
      return {
        id: item,
        name: name || <code className='small'>{item.substr(0, 10)}...{item.substr(-8)}</code>,
        icon: addressIcon,
      }
    })
    if (dropdownBrowserAccounts.length) {
      dropdownBrowserAccounts.unshift({ header: networkManager.browserExtension.name.toLowerCase() })
      dropdownBrowserAccounts.unshift({ divider: true })
    }

    const dropdownStarred = starred.map(item => {
      const name = this.state.keypairs.find(k => k.address === item)?.name
      return {
        id: item,
        name: name || <code className='small'>{item.substr(0, 10)}...{item.substr(-8)}</code>,
        icon: addressIcon,
      }
    })

    const dropdownStarredContracts = starredContracts.map(item => {
      const name = this.state.keypairs.find(k => k.address === item)?.name
      return {
        id: item,
        name: <code className='small'>{item}</code>,
        // name: name || <code className='small'>{item.substr(0, 10)}...{item.substr(-8)}</code>,
        icon: addressIcon,
      }
    })

    let dropdownStarredInContract = [{ header: 'starred' }, ...dropdownStarredContracts.map(item => ({ ...item, icon: contractIcon }))]
    if (dropdownStarred.length) {
      dropdownStarred.unshift({ header: 'starred' })
      dropdownStarred.unshift({ divider: true })
    }
    if (!starredContracts.length) {
      dropdownStarredInContract.push({ none: true })
    }
    if (extraContractItems) {
      dropdownStarredInContract = [...extraContractItems, ...dropdownStarredInContract]
    }

    let contractName
    if (selectedContract) {
      if (extraContractItems) {
        contractName = extraContractItems.find(item => item.id === selectedContract)?.name
      }
      if (!contractName) {
        contractName = <code>{selectedContract}</code>
      }
    }
    const accountName = selectedAccount && (this.state.keypairs.find(k => k.address === selectedAccount)?.name || <code>{selectedAccount}</code>)

    const navbarRight = [
      {
        route: 'contract',
        title: 'Contract',
        icon: 'fas fa-file-invoice',
        selected: { id: selectedContract, name: contractName },
        dropdown: dropdownStarredInContract,
        onClickItem: selected => headerActions.selectContract(network.id, selected),
        contextMenu: () => [{
          text: 'Remove from Starred',
          onClick: ({ id }) => redux.dispatch('REMOVE_ACCOUNT', { network: network.id, account: id }),
        }],
      },
      {
        route: 'account',
        title: 'Explorer',
        icon: 'fas fa-map-marker-alt',
        noneIcon: 'fas fa-map-marker-times',
        selected: { id: selectedAccount, name: accountName },
        dropdown: [...dropdownKeypairs, ...dropdownBrowserAccounts, ...dropdownStarred],
        onClickItem: selected => headerActions.selectAccount(network.id, selected),
        contextMenu: address => {
          if (starred.indexOf(address) === -1) {
            return
          }
          return [{
            text: 'Remove from Starred',
            onClick: ({ id }) => {
              redux.dispatch('REMOVE_ACCOUNT', { network: network.id, account: id })
            },
          }]
        },
      },
      {
        route: 'network',
        title: 'Network',
        icon: network.icon,
        selected: network,
        dropdown: networkList,
        onClickItem: (_, network) => {
          networkManager.setNetwork(network)
        },
      },
    ]

    return (
      <>
        <Navbar
          profile={profile}
          navbarLeft={navbarLeft}
          navbarRight={navbarRight}
        />
        <NewProjectModal />
      </>
    )
  }
}
