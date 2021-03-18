const fs = require('fs-extra')

module.exports = {
  fs,
  spawn: require('./spawn'),
  style: require('kleur'),
  prompt: require('prompts'),
  glob: require('globby'),
  argParse: require('mri'),
  isDirEmpty: dir => fs.promises.readdir(dir).then(files => files.length === 0)
}
