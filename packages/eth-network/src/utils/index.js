export default {
  isNetworkConnectError: error =>  (/noNetwork|NETWORK_ERROR/g).test(error),
}