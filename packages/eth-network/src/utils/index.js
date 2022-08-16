export default {
  isNetworkConnectError: error =>  (/noNetwork|NETWORK_ERROR/g).test(error),
  isJsonRPCError: error =>  (/Internal JSON-RPC error|JSON-RPC error/g).test(error),
}