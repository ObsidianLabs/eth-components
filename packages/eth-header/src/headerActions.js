import redux from '@obsidians/redux'

export class HeaderActions {
  constructor() {
    this.history = null
    this.newProjectModal = null
  }

  selectContract (network, contract) {
    redux.dispatch('SELECT_CONTRACT', { network, contract })
  }

  selectAccount (network, account) {
    redux.dispatch('SELECT_ACCOUNT', { network, account })
  }

  updateNetwork (networkId) {
    const loadNetworkResources = redux.getState().loadNetworkResources
    if(!loadNetworkResources && networkId == 'custom') {
      redux.dispatch('LOAD_NETWORK_RESOURCES', true)
      return this.history.push(`/network/${networkId}`)
    }
    if (this?.history?.location?.pathname?.startsWith('/network')) {
      this.history.push(`/network/${networkId}`)
    }
  }
}

export default new HeaderActions()
