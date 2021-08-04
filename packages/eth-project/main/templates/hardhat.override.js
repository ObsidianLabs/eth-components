const hardhatConfig = require('./hardhat.config.js')
const config = require('./config.json')

const solidity = Object.assign({}, hardhatConfig.solidity, {
  version: config.compilers.solc,
  settings: {
    optimizer: config.compilers.optimizer,
    evmVersion: config.compilers.evmVersion,
  },
})

module.exports = Object.assign({}, hardhatConfig, {
  solidity,
})
