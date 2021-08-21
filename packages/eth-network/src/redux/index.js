import { Map } from 'immutable'

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
  }
}