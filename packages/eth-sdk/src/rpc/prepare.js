export default parameters => {
  console.log(parameters)
  const obj = parameters.obj
  return Object.keys(obj).map(key => {
    const param = obj[key]
    if (key === 'blockNumber') {
      if (param.value === '0') {
        return 'latest'
      }
      return `0x${BigInt(param.value).toString(16)}`
    }
    return param.value 
  })
}