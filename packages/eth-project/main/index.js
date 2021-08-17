const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const { FileTreeChannel } = require('@obsidians/filetree')

const isDirectoryNotEmpty = dirPath => {
  try {
    const stat = fs.statSync(dirPath)
    if (!stat.isDirectory()) {
      return false
    }
  } catch (e) {
    return false
  }

  const files = fs.readdirSync(dirPath)
  if (files && files.length) {
    return true
  }

  return false
}

const copyRecursiveSync = (src, dest, { name, framework }) => {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fse.ensureDirSync(dest)
    fs.readdirSync(src).forEach(childFile => {
      copyRecursiveSync(path.join(src, childFile), path.join(dest, childFile), { name, framework })
    })
  } else {
    const srcContent = fs.readFileSync(src, 'utf8')
    const replacedContent = srcContent
      .replace(/#name/g, name)
      .replace(/#framework/g, framework)
    const replacedDestPath = dest.replace(/#name/g, name)

    fs.writeFileSync(replacedDestPath, replacedContent)
    if (src.endsWith('.sh')) {
      fs.chmodSync(replacedDestPath, '0755')
    }
  }
}

class ProjectChannel extends FileTreeChannel {
  async post (stage, { template, projectRoot, name, framework, compilerVersion }) {
    if (stage) {
      return this.postCreation({ name, projectRoot, framework })
    }

    if (await isDirectoryNotEmpty(projectRoot)) {
      throw new Error(`<b>${projectRoot}</b> is not an empty directory.`)
    }

    const templateFolder = path.join(__dirname, 'templates', template)
    try {
      fs.readdirSync(templateFolder)
    } catch (e) {
      throw new Error(`Template "${template}" does not exist.`)
    }

    copyRecursiveSync(templateFolder, projectRoot, { name, framework })

    const configJson = fs.readFileSync(path.join(projectRoot, 'config.json'), 'utf8')
    const config = JSON.parse(configJson)

    if (framework === 'truffle-docker') {
      const truffleConfig = fs.readFileSync(path.join(__dirname, 'templates', 'truffle-config.js'), 'utf8')
      fs.writeFileSync(path.join(projectRoot, 'truffle-config.js'), truffleConfig)

      config.compilers = { truffle: compilerVersion, ...config.compilers }
      fs.writeFileSync(path.join(projectRoot, 'config.json'), JSON.stringify(config, null, 2))
      fs.rmdirSync(path.join(projectRoot, 'scripts'), { recursive: true })
    } else if (framework === 'truffle') {
      const truffleConfig = fs.readFileSync(path.join(__dirname, 'templates', 'truffle-config.js'), 'utf8')
      fs.writeFileSync(path.join(projectRoot, 'truffle-config.js'), truffleConfig)
      fs.rmdirSync(path.join(projectRoot, 'scripts'), { recursive: true })
    } else if (framework === 'hardhat') {
      const hardhatConfig = fs.readFileSync(path.join(__dirname, 'templates', 'hardhat.config.js'), 'utf8')
      fs.writeFileSync(path.join(projectRoot, 'hardhat.config.js'), hardhatConfig)
      
      config.deploy = ''
      fs.writeFileSync(path.join(projectRoot, 'config.json'), JSON.stringify(config, null, 2))
      fs.rmdirSync(path.join(projectRoot, 'migrations'), { recursive: true })
      fs.unlinkSync(path.join(projectRoot, 'scripts', 'waffle-deploy.js'))
    } else if (framework === 'waffle') {
      const waffleConfig = fs.readFileSync(path.join(__dirname, 'templates', 'waffle.js'), 'utf8')
      fs.writeFileSync(path.join(projectRoot, 'waffle.js'), waffleConfig)
      fs.rmdirSync(path.join(projectRoot, 'migrations'), { recursive: true })
      fs.unlinkSync(path.join(projectRoot, 'scripts', 'deploy.js'))
    }

    return { projectRoot, name }
  }

  async postCreation ({ name, projectRoot, framework }) {
    const packageJson = fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8')
    const packageObj = JSON.parse(packageJson)
    if (framework === 'truffle') {
      packageObj.scripts = { deploy: 'truffle deploy' }
    } else if (framework === 'hardhat') {
      packageObj.scripts = { deploy: 'hardhat run scripts/deploy.js' }
    } else if (framework === 'waffle') {
      packageObj.scripts = { deploy: 'node scripts/waffle-deploy.js' }
    }
    fs.writeFileSync(path.join(projectRoot, 'package.json'), JSON.stringify(packageObj, null, 2))
    return { projectRoot, name }
  }
}

module.exports = ProjectChannel
