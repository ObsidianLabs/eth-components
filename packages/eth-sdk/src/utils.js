import { ethers } from 'ethers'

const util = {
  format: {
    bytes: () => ''
  }
}

export default {
  sign: {
    sha3: ethers.utils.keccak256
  },
  format: {
    bytes: util.format.bytes
  },
  unit: {
    fromValue: ethers.utils.formatEther,
    toValue: ethers.utils.parseEther,
    valueToGvalue: v => ethers.utils.formatUnits(v, 'gwei')
  }
}