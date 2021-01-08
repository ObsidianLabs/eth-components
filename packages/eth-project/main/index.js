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

const copyRecursiveSync = (src, dest, name) => {
  const exists = fs.existsSync(src)
  const stats = exists && fs.statSync(src)
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fse.ensureDirSync(dest)
    fs.readdirSync(src).forEach(childFile => {
      copyRecursiveSync(path.join(src, childFile), path.join(dest, childFile), name)
    })
  } else {
    const srcContent = fs.readFileSync(src, 'utf8')
    const replacedContent = srcContent.replace(/#name/g, name)
    const replacedDestPath = dest.replace(/#name/g, name)

    fs.writeFileSync(replacedDestPath, replacedContent)
    if (src.endsWith('.sh')) {
      fs.chmodSync(replacedDestPath, '0755')
    }
  }
}


class ProjectChannel extends FileTreeChannel {
  async post (_, { template, projectRoot, name }) {
    if (await isDirectoryNotEmpty(projectRoot)) {
      throw new Error(`<b>${projectRoot}</b> is not an empty directory.`)
    }

    const templateFolder = path.join(__dirname, 'templates', template)
    try {
      fs.readdirSync(templateFolder)
    } catch (e) {
      throw new Error(`Template "${template}" does not exist.`)
    }

    copyRecursiveSync(templateFolder, projectRoot, name)

    return { projectRoot, name }
  }
}

module.exports = ProjectChannel
