const { join, relative } = require('path')
const { spawn, style, argParse } = require('@fbi-js/utils')

module.exports = async function cli () {
  const args = argParse(process.argv.slice(2))
  const command = args._[0]
  const versions = await getVersions()

  if (!command) {
    if (args.v || args.V || args.version) {
      console.log(`fbi: ${style.cyan(versions.fbi)}`)
      console.log(`node: ${style.cyan(versions.node)}`)
      console.log(`npm: ${style.cyan(versions.npm)}`)
    } else {
      showHelp()
    }
    process.exit()
  }

  const subArgs = process.argv.slice(3)

  // For local test
  // e.g.: npx fbi commit --local
  const isLocal = args.local
  if (isLocal) {
    process.env['FBI_ENV'] = 'local'
  }

  // remove '--local'
  subArgs.splice(subArgs.indexOf('--local'), 1)

  let package = `${
    command.startsWith('@') || command.startsWith('file:') ? '' : '@fbi-js/'
  }${command.startsWith('fbi-') ? command.slice(4) : command}`

  if (isLocal && !package.startsWith('file:')) {
    const npmMainVersion = versions.npm.split('.')[0] * 1
    package = package.replace('@fbi-js/', '')

    const relativePath = relative(
      process.cwd(),
      join(__dirname, '../commands/')
    )
    package = `${relativePath}/${package}/${
      npmMainVersion < 7 ? 'bin/run' : ''
    }`
  }

  // usage:
  // npx fbi commit
  // npx fbi fbi-commit
  // npx fbi @fbi-js/commit
  // npx fbi ../packages/commands/commit

  // npm v6: npx path/to/commit/bin/run
  // npm v7: npx path/to/commit/
  try {
    let cmd = `npx ${package}`
    if (Array.isArray(subArgs) && subArgs.length > 0) {
      cmd += ` ${subArgs.join(' ')}`
    }
    console.log(style.cyan(cmd))
    await spawn(cmd, {
      stdio: 'inherit'
    })
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }
}

async function getVersions () {
  const { version } = require('./package.json')
  const { stdout } = await spawn('npm --version', { encoding: 'utf8' })

  return {
    fbi: version,
    node: process.versions.node,
    npm: stdout.replace(/\\\n[ \t]*/g, '')
  }
}

async function showHelp () {
  console.log('Usage: npx fbi [command] [options]\n')
  console.log(
    `Available commands: ${style.cyan(
      'https://github.com/fbi-js/fbi-next#commands'
    )}`
  )
}
