/** 
 *  Ethers encounter compatible issue with Celo
 *  With more details click here: https://github.com/ethers-io/ethers.js/issues/1735
 * */ 

const getCeloProvider = (rpc, providers, BigNumber) => {
  const provider = new providers.JsonRpcProvider(rpc)
  const originalBlockFormatter = provider.formatter._block;
  provider.formatter._block = (value, format) => {
    return originalBlockFormatter(
      {
        gasLimit: BigNumber.from(0),
        nonce: '',
        difficulty: 0,
        ...value,
      },
      format,
    )
  }
  return provider
}

export default getCeloProvider


