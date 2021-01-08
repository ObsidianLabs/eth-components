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

  removeFromStarred (network, account) {
    redux.dispatch('REMOVE_ACCOUNT', { network, account })
  }

  updateNetwork (networkId) {
    this.history.push(`/network/${networkId}`)
  }
}

export default new HeaderActions()
