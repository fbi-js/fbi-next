const path = require('path')
const { spawn } = require('@fbi-js/utils')

module.exports = async function cli () {
  const args = process.argv.slice(2)
  const command = args[0]

  if (!command) {
    console.log('Usage: npx fbi-cli [command] [options]')
    process.exit()
  }

  // For local test
  // e.g.: npx fbi-cli commit --local
  const isLocal = args.includes('--local')

  let package = `${
    command.startsWith('@fbi-js') ||
    command.startsWith('fbi-') ||
    command.startsWith('file:')
      ? ''
      : '@fbi-js/'
  }${command}`

  if (isLocal && !package.startsWith('file:')) {
    const relativePath = path.relative(
      process.cwd(),
      path.join(__dirname, '../../')
    )
    package = `file:${relativePath}/${package}`
  }

  // usage:
  // npx fbi-cli commit
  // npx fbi-cli fbi-commit
  // npx fbi-cli @fbi-js/commit
  // npx fbi-cli file:../packages/@fbi-js/commit
  const cmdStr = `npx ${package} ${args.slice(1)}`
  console.log(`Running '${cmdStr}'...`)

  try {
    await spawn(`npx`, [package, ...args.slice(1)], {
      stdio: 'inherit'
    })
    console.log(`Done '${cmdStr}'`)
  } catch (err) {
    console.log(err.message)
    process.exit(1)
  }
}
