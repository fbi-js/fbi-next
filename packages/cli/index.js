const path = require('path')
const { spawn, argParse } = require('@fbi-js/utils')

module.exports = async function cli () {
  const args = argParse(process.argv.slice(2))
  const command = args._[0]

  if (!command) {
    console.log('Usage: npx fbi-cli [command] [options]')
    process.exit()
  }

  const subArgs = process.argv.slice(3)

  // For local test
  // e.g.: npx fbi-cli commit --local
  const isLocal = args.local

  let package = `${
    isLocal || command.startsWith('@') || command.startsWith('file:')
      ? ''
      : '@fbi-js/'
  }${command.startsWith('fbi-') ? command.slice(4) : command}`

  if (isLocal && !package.startsWith('file:')) {
    const relativePath = path.relative(
      process.cwd(),
      path.join(__dirname, '../commands/')
    )
    package = `file:${relativePath}/${package}`
  }

  // usage:
  // npx fbi-cli commit
  // npx fbi-cli fbi-commit
  // npx fbi-cli @fbi-js/commit
  // npx fbi-cli file:../packages/@fbi-js/commit
  try {
    await spawn(`npx`, [package, ...subArgs], {
      stdio: 'inherit'
    })
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }
}
