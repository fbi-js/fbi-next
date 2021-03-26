const { extname } = require('path')
const { spawn, style, argParse, resolveConfig } = require('@fbi-js/utils')

module.exports = async function format (pattern) {
  try {
    const config = resolveConfig()
    const args = argParse(process.argv.slice(2))
    const patterns =
      pattern ||
      args._[0] ||
      (config.format && config.format.pattern) ||
      'src/**/*'
    // console.log('running fbi-format', args, config, patterns)
    await formatWithPrettier(patterns)
    await formatWithEslint(config.create, patterns)
    console.log(style.green('Formatted successfully!'))
  } catch (err) {
    const msg = catchFatalErrors(err)
    if (msg) {
      console.error(msg)
      process.exit()
    }
  }
}

function formatWithPrettier (pattern) {
  const cmd = `npx prettier ${pattern} --write --ignore-unknown --loglevel=warn`
  console.log(style.cyan(cmd))
  return spawn(cmd, {
    stdio: 'inherit'
  })
}

function formatWithEslint (config, pattern) {
  const hasExt = !!extname(pattern).trim()
  let path = pattern
  if (!hasExt) {
    const exts = getFileExts(config)
    path = `${pattern}.{${exts.join(',')}}`
  }
  const cmd = `npx eslint ${path} --fix --no-error-on-unmatched-pattern`
  console.log(style.cyan(cmd))
  return spawn(cmd, {
    stdio: 'inherit',
    cwd: process.cwd()
  })
}

function getFileExts (project) {
  return ['js', 'jsx']
    .concat(project.features.includes('typescript') ? ['ts', 'tsx'] : [])
    .concat(project.template.includes('vue') ? ['vue'] : [])
}

function catchFatalErrors (err) {
  // https://prettier.io/docs/en/cli.html#exit-codes
  // https://eslint.org/docs/user-guide/migrating-to-5.0.0#fatal-errors-now-result-in-an-exit-code-of-2
  if (err.exitCode === 2) {
    return err.message
  }

  return ''
}
