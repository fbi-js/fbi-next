const fs = require('fs-extra')
const { resolveConfig } = require('./config')
const spawn = require('./spawn')
const typeFns = require('./type')

module.exports = {
  ...typeFns,
  fs,
  spawn,
  git: require('./git'),
  merge: require('./merge'),
  style: require('kleur'),
  prompt: require('prompts'),
  glob: require('globby'),
  argParse: require('mri'),
  isDirEmpty: dir => fs.promises.readdir(dir).then(files => files.length === 0),
  resolveConfig,
  isGitRepo: async (cwd = process.cwd()) => {
    try {
      await spawn('git rev-parse --git-dir', { cwd, stdio: 'ignore' })
      return true
    } catch (err) {
      return false
    }
  }
}
