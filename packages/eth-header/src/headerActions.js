import redux from '@obsidians/redux'
import Auth from '@obsidians/auth'

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
    if (this?.history?.location?.pathname?.startsWith('/network') && networkId !== 'custom') {
      this.history.push(`/network/${networkId}`)
    }
  }

  forkProjectNeedUserLogin (providers) {
    if (this?.history) Auth.login(this.history, providers[0])   
  }
}

export default new HeaderActions()
