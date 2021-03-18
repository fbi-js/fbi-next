const { basename } = require('path')
const { fs, style, argParse } = require('@fbi-js/utils')
const { chooseTemplate, chooseTargetDir } = require('./questions')
const { getFiles, copyFiles, renderFiles } = require('./files')

module.exports = async function create () {
  const args = argParse(process.argv.slice(2), {
    default: { template: '' }
  })

  const tmpl = await chooseTemplate(args.template)

  if (!tmpl.path || !(await fs.pathExists(tmpl.path))) {
    throw new Error(`Template '${template}' not exist`)
  }

  console.log(style.cyan(`Creating project via template '${tmpl.value}'...`))
  console.log(style.gray(`Template path: ${tmpl.path}`))
  const { filesToRender, filesToCopy } = await getFiles(tmpl.path, ['ignore'])
  const targetDir = await chooseTargetDir(process.cwd(), args.name)

  await copyFiles(filesToCopy, tmpl.path, targetDir)
  await renderFiles(filesToRender, tmpl.path, targetDir, {
    project: {
      name: args.name || basename(targetDir),
      description: `base on template ${tmpl.title}`,
      template: tmpl.value
    }
  })
  console.log(style.green('Project created!'))
}
