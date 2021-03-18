const ejs = require('ejs')
const { join } = require('path')
const { fs, glob, style } = require('@fbi-js/utils')

async function getFiles (cwd, ignore = []) {
  const ignores = Array.isArray(ignore) ? ignore : [ignore]
  const opts = {
    cwd,
    ignore: ignores,
    suppressErrors: true,
    throwErrorOnBrokenSymbolicLink: true,
    onlyFiles: true,
    dot: true,
    extglob: true
  }
  const filesToRender = await glob('**/*.ejs', opts)
  const filesToCopy = await glob(['**/*', '!**/*.ejs'], opts)

  return { filesToRender, filesToCopy }
}

async function copyFiles (files, srcDir, distDir) {
  console.log('Copy files:')
  for (let i = 0, len = files.length; i < len; i++) {
    const file = files[i]
    try {
      console.log(style.gray(file))
      const src = join(srcDir, file)
      const dist = join(distDir, file)
      await fs.copy(src, dist)
    } catch (err) {
      console.error(err)
      console.log(style.red(`[CopyError] file '${file}'`))
      console.log(style.red(err.message))
    }
  }
}

async function renderFiles (files, srcDir, distDir, data) {
  console.log('Render files:')
  for (let i = 0, len = files.length; i < len; i++) {
    const file = files[i]
    console.log(style.gray(file))
    try {
      const src = join(srcDir, file)
      const dist = join(distDir, file.replace(/(.*)(.ejs)$/, '$1'))
      const content = await fs.readFile(src, 'utf8')
      const rendered = await ejs.render(content.trim() + '\n', data, {
        async: true
      })
      await fs.outputFile(dist, rendered, {})
    } catch (err) {
      console.log(style.red(`[RenderError] file '${file}'`))
      console.log(style.red(err.message))
    }
  }
}

module.exports = {
  getFiles,
  copyFiles,
  renderFiles
}
