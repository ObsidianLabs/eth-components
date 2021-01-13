import { ethers } from 'ethers'

const util = {
  sign: {
    sha3: () => ''
  },
  format: {
    bytes: () => ''
  }
}

export default {
  sign: {
    sha3: util.sign.sha3
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