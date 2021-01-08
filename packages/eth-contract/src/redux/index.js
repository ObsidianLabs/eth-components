import { Map } from 'immutable'

import AdminControl from './abi/AdminControl.json'
import SponsorWhitelistControl from './abi/SponsorWhitelistControl.json'
import Staking from './abi/Staking.json'
import Boomflow from './abi/boomflow.json'
import CRCL from './abi/CRCL.json'
import ERC777 from './abi/ERC777.json'
import FC from './abi/FC.json'

export default {
  default: Map(),
  persist: true,
  actions: {
    ABI_ADD: {
      reducer: (state, { payload }) => {
        return state.set(payload.codeHash, Map(payload))
      }
    },
    ABI_DELETE: {
      reducer: (state, { payload }) => state.remove(payload)
    },
    ADD_DEFAULT_ABIS: {
      reducer: state => {
        return state
          .set('0x0888000000000000000000000000000000000000', Map({ name: 'AdminControl', abi: JSON.stringify(AdminControl) }))
          .set('0x0888000000000000000000000000000000000001', Map({ name: 'SponsorWhitelistControl', abi: JSON.stringify(SponsorWhitelistControl) }))
          .set('0x0888000000000000000000000000000000000002', Map({ name: 'Staking', abi: JSON.stringify(Staking) }))
          .set('0xb523b7e2ce483e43339c6f01d9f26e8b94660d5c29f0ebc8ac951a8547bdd2ae', Map({ name: 'Boomflow', abi: JSON.stringify(Boomflow) }))
          .set('0x0b84ef45839e8ad40e64b964606fb7d3b3700840c15f6166fb95868eeaa2f5ae', Map({ name: 'CRCL', abi: JSON.stringify(CRCL) }))
          .set('0xedc72b7c19d49d58d5ee62be4c57acb8ae0f4d33e5c0e66b439827a6b3cf84f6', Map({ name: 'ERC777', abi: JSON.stringify(ERC777) }))
          .set('0xd33f9b387b882b5d7e222a2c9f0f9fdc4aaa0b0c16c7c65de4d792ac800d1b07', Map({ name: 'FC', abi: JSON.stringify(FC) }))
      }
    },
  }
}