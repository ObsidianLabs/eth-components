import React, { PureComponent } from 'react'

import Navbar from '@obsidians/navbar'
import keypairManager from '@obsidians/keypair'
import { NewProjectModal, navbarItem } from '@obsidians/eth-project' 
import { networkManager } from '@obsidians/eth-network'

import headerActions from './headerActions'

const internalContracts = {
  '0x0888000000000000000000000000000000000000': 'AdminControl',
  '0x0888000000000000000000000000000000000001': 'SponsorWhitelistControl',
  '0x0888000000000000000000000000000000000002': 'Staking',
}

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
      starred,
      selectedContract,
      selectedAccount,
      network,
      networkList,
    } = this.props

    const username = profile.get('username') || 'local'
    const navbarLeft = [
      navbarItem(projects, selectedProject, username)
    ]

    const dropdownKeypairs = this.state.keypairs.map(k => ({ id: k.address, name: k.name || <code>{k.address.substr(0, 6)}...{k.address.substr(-4)}</code> }))
    if (!dropdownKeypairs.length) {
      dropdownKeypairs.push({ none: true })
    }
    dropdownKeypairs.unshift({ header: 'keypair manager' })
   
    const dropdownStarred = starred.map(item => ({ id: item, name: <code>{item.substr(0, 6)}...{item.substr(-4)}</code> }))
    const dropdownStarredInContract = [{ header: 'starred' }, ...dropdownStarred]
    if (dropdownStarred.length) {
      dropdownStarred.unshift({ header: 'starred' })
      dropdownStarred.unshift({ divider: true })
    } else {
      dropdownStarredInContract.push({ none: true })
    }
    dropdownStarredInContract.unshift({ divider: true })
    dropdownStarredInContract.unshift({ id: '0x0888000000000000000000000000000000000002', name: 'Staking' })
    dropdownStarredInContract.unshift({ id: '0x0888000000000000000000000000000000000001', name: 'SponsorWhitelistControl' })
    dropdownStarredInContract.unshift({ id: '0x0888000000000000000000000000000000000000', name: 'AdminControl' })
    dropdownStarredInContract.unshift({ header: 'internal contracts' })

    const contractName = selectedContract && (internalContracts[selectedContract] || <code>{selectedContract}</code>)
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
          onClick: ({ id }) => headerActions.removeFromStarred(network.id, id),
        }],
      },
      {
        route: 'account',
        title: 'Explorer',
        icon: 'fas fa-file-invoice',
        selected: { id: selectedAccount, name: accountName },
        dropdown: [...dropdownKeypairs, ...dropdownStarred],
        onClickItem: selected => headerActions.selectAccount(network.id, selected),
        contextMenu: () => [{
          text: 'Remove from Starred',
          onClick: ({ id }) => headerActions.removeFromStarred(network.id, id),
        }],
      },
      {
        route: 'network',
        title: 'Network',
        icon: network.icon,
        selected: network,
        dropdown: networkList,
        onClickItem: networkId => {
          headerActions.updateNetwork(networkId)
          networkManager.setNetwork(networkId)
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
