const translation = {
  bottombar: {
    abiStorage: 'ABI Storage',
  },
  compiler: {
    project: 'Project',
    compiler: 'Compiler',
    downloadingSolc: 'Downloading Solc Bin',
    downloadingSolcMessage: 'Downloading <b>{{version}}</b>...',
    start: 'Start',
    truffle: {
      start: 'Start Truffle Console',
      starting: 'Starting Truffle Console...',
      manager: '{{compiler}} Manager',
      downloading: 'Downloading {{compiler}}',
    },
    solc: {
      title: 'Solc',
      noneName: 'solc',
      manager: 'Solc Manager',
      downloading: 'Downloading Solc',
      default: 'Default Solc',
      defaultSelect: 'Default Solc Selected',
      defaultSelectMessage: 'The version of solc used in compilation will be determined by <b>truffle-config.js</b>.',
      selected: 'Solc v{{version}} Selected',
      selectedMessage: 'This will overwrite the configuration of <b>truffle-config.js</b> in compilation.',
    },
    build: {
      start: 'Build',
      stop: 'Stop Build',
      building: 'Building Project',
      buildingMessage: 'Building...',
      success: 'Build Successful',
      successMessage: 'The smart contract is built.',
    },
    error: {
      noMainFile: 'No Main File',
      noMainFileMessage: 'Please specify the main file in project settings.',
      buildFailed: 'Build Failed',
      codeError: 'Code has errors.',
      noVersion: 'No {{compiler}} Version',
      noVersionMessage: 'Please select a version for {{compiler}} in project settings.',
      notInstall: '{{compiler}} {{version}} not Installed',
      notInstallMessage: 'Please install the version in <b>{{compiler}} Manager</b> or select another version in project settings.',
      solcNotInstall: 'Solc {{solc}} not Installed',
      solcNotInstallMessage: 'Please install the version in <b>Solc Manager</b> or select another version in project settings.',
      noNetwork: 'No Network Detected',
      noNetworkMessage: 'No Ethereum node instance is running.',
    },
  },
}

export default {
  translation
}
