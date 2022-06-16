const translation = {
  client: 'client',
  framework: 'Framework',
  transfer: 'Transfer',
  signPush: 'Sign and Push',
  pushing: 'Pushing...',
  recipient: 'Recipient',
  amount: 'Amount',
  welcome: {

  },
  header: {
    title: {
      project: 'Project',
      contract: 'Contract',
      explorer: 'Explorer',
      network: 'Network',
      none: 'None',
      loginInAs: 'Logged in as',
      desktopApp: 'Desktop App',
      githubRepo: 'GitHub Repo',
      reportIssue: 'Report an Issue',
      helpPage: 'Help page',
      myProjects: 'My Projects',
      logout: 'Log out',
      login: 'Login',
      notLogin: 'not logged in',
      createProject: 'Create Project',
      openProject: 'Open Project',
      projects: 'Projects',
      new: 'New',
      open: 'Open',
      recent: 'Recent Transactions',
      storage: 'Storage',
      nativeCoin: 'Native Coin',
      nodeURL: 'Node URL',
      blocks: 'Blocks',
      blockNumber: 'Block Number',
      blockTime: 'Block Time',
    }
  },
  explorer: {
    page: {
      newPage: 'New Page',
      newPageText: 'Please enter an {{chainName}} address.',
      invalidAddress: 'Invalid Address',
      account: 'Account',
      information: 'Information',
      balance: 'Balance',
      totalSupply: 'Total Supply',
    },
    transactions: {
      transactions: 'Transactions',
      noTransactions: 'No Transactions Found',
      loadMore: 'Load More',
      time: 'time',
      block: 'block',
      txHash: 'tx hash',
      from: 'from',
      to: 'to',
      value: 'value',
      gasUsed: 'gas used',
      fee: 'fee',
      transferFailed: 'Transfer Failed',
      transferFailedText: 'The amount is empty.',
    }
  },
  network: {
    network: {
      network: 'Network',
      networkLow: 'network',
      networkDisconnect: 'Network disconnect',
      noNetwork: 'No Network',
      noNetworkText: 'No connected network. Please start a local network or switch to a remote network.',
      webNoNetworkText: 'No connected network. Please switch to a remote network.',
      tools: 'network tools',
      Tools: 'Network Tools',
      disconnect: 'Disconnect',
      reconnect: 'Reconnect',
      connected: 'Network Connected',
      gotoNetwork: 'Go to Network',
      internetDis: 'Internet Disconnected',
      detected: 'No Network Detected',
      detectedText: 'No Ethereum node instance is running.',
      errorParameters: 'Error in Parameters',
      switchedTo: 'Switched to',
      startingTruffle: 'Starting Truffle Console',
      connectedTo: 'Connected to network at',
      error: 'Network Connection Error',
      errorDesc: 'Please refresh this page or reconnect the current network.',
      errorText: 'Please refresh or try later.',
      serveBusy: 'Serve Request Busy',
    },
    custom: {
      custom: 'Custom Network',
      create: 'New Connection',
      customConnect: 'Custom Network Connection',
      none: 'No Custom Networks',
      check: 'Check Network',
      add: 'Add Network',
      update: 'Update Network',
      modify: 'Modify',
      connect: 'Connect',
      connecting: 'Connecting...',
      try: 'Trying to connect',
      err: 'Network Error',
      errText: 'Failed to connect the network. Make sure you entered a valid url for the node RPC.',
      invalidName: 'Invalid network name',
      invalidNameText: '<b>{{name}}</b> alreay exists.',
      del: 'Delete Custom Network',
      delConfirm: 'Delete',
      delTips: 'Are you sure you want to delete ',
      delTwoTips: ' ? Once deleted, ',
      delTipsEnd: 'it will be disconnected immediately and cannot be restored.',
      delConTips: 'it cannot be restored.',
    },
    dev: {
      newInstance: 'New Instance',
      placeholder: 'Can only contain letters, digits, dash or underscore',
      name: 'Instance name',
      fail: 'Failed',
      failText: 'You have an instance named {{name}}, please use a different name.',
      failedText: 'Please create or import a keypair in the keypair manager first.',
      started: '{{name}} Instance Started',
      startedText: '<b>{{name}}</b> is running now.',
      stopped: '{{name}} Instance Stopped',
      stoppedText: '<b>{{name}}</b> stops to run.',
    }
  },
  rpc: {
    client: 'RPC Client',
    fail: 'Call RPC Failed',
    result: 'Result',
    parameters: 'Parameters',
  },
  abi: {
    storage: 'ABI Storage',
    name: 'Name',
    codeHash: 'Code Hash',
    address: 'Address',
    enterNew: 'Enter New ABI',
    inputPlaceholder: 'Please enter the ABI object. Must be a valid JSON array.',
    selectProject: 'Select from the current project',
    fail: 'Failed to parse ABI',
    failText: 'The saved ABI is not a valid JSON.',
    add: 'ABI Added',
    addText: 'A new ABI record is added to the storage.',
    del: 'ABI Deleted',
    delText: 'The ABI record is removed from the storage.',
    update: 'ABI Updated',
    updateText: 'The ABI record is updated in the storage.',
    invalid: 'Invalid json file',
    invalidText: 'Abi should be an array.',
  }
}

export default {
  translation
}
