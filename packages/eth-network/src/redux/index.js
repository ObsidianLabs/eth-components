import { Map, fromJS } from 'immutable'

export default {
  default: Map({}),
  persist: true,
  actions: {
    ADD_CUSTOM_NETWORK: {
      reducer: (state, { payload }) => state.set(payload.name, Map(payload))
    },
    MODIFY_CUSTOM_NETWORK: {
      reducer: (state, { payload }) => state
        .remove(payload.name)
        .set(payload.option.name, Map(payload.option))
    },
    REMOVE_CUSTOM_NETWORK: {
      reducer: (state, { payload }) => state.remove(payload)
    },
    ACTIVE_CUSTOM_NETWORK: {
      reducer: (state, { payload }) => {
        if (payload.id === 'custom') {
          return state
        }
        return state.map((network) => {
          if (!network) return fromJS({})
          if (payload.name === network.toJS().name) return network.set('active', true)
          else return network.set('active', false)
        })
      }
    },
  }
}