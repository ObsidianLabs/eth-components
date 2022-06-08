import networkManager from '../networkManager'

async function getMetamaskConnect (){
  const { ethereum } = window;
  try {
    const chainId = await ethereum.request({ method: 'eth_chainId' });
    const network = networkManager.networks.find(n => n.chainId === parseInt(chainId))
    network && networkManager.setNetwork(network, { force: true })
  } catch (err) {
    console.error(err);
  }
}

export default {
  isNetworkConnectError: error =>  (/noNetwork|NETWORK_ERROR/g).test(error),
  getMetamaskConnect,
}