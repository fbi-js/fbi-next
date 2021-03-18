const cp = require('child_process')

module.exports = function spawn (cmd, args, opts) {
  opts = opts || {}
  opts.shell = opts.shell || process.platform === 'win32'
  return new Promise((resolve, reject) => {
    const child = cp.spawn(cmd, args, opts)
    let stdout = ''
    let stderr = ''
    child.stdout &&
      child.stdout.on('data', d => {
        stdout += d
      })
    child.stderr &&
      child.stderr.on('data', d => {
        stderr += d
      })
    child.on('error', reject)
    child.on('close', code => {
      if (code) {
        const err = new Error(`Command failed: ${cmd} ${args.join(' ')}`)
        err.isOperational = true
        err.stderr = stderr
        err.exitCode = code
        reject(err)
      } else {
        resolve({ code, stdout, stderr })
      }
    })
  })
}
