const { join } = require('path')

function resolveConfig (cwd = process.cwd()) {
  // package.json

  try {
    const pkg = require(join(cwd, 'package.json'))
    return pkg.fbi || {}
  } catch (err) {
    return {}
  }
}

module.exports = { resolveConfig }
