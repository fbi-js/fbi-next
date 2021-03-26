const { basename } = require('path')
const { fs, style, argParse } = require('@fbi-js/utils')
const {
  chooseTemplate,
  chooseFeatues,
  chooseTargetDir
} = require('./questions')
const { getFiles, copyFiles, renderFiles } = require('./files')

module.exports = async function create () {
  // data for render
  let data = {}
  const args = argParse(process.argv.slice(2), {
    default: { template: '' }
  })

  const tmpl = await chooseTemplate(args.template)
  if (!tmpl.path || !(await fs.pathExists(tmpl.path))) {
    throw new Error(`Template '${template}' not exist`)
  }

  data['features'] =
    Array.isArray(tmpl.features) && tmpl.features.length > 0
      ? await chooseFeatues(tmpl.features)
      : []

  console.log(style.cyan(`Creating project via template '${tmpl.value}'...`))
  console.log(style.gray(`Template path: ${tmpl.path}`))
  const { filesToRender, filesToCopy } = await getFiles(
    tmpl.path,
    tmpl.globIgnore ? tmpl.globIgnore(data) : []
  )
  console.log({ filesToRender, filesToCopy })
  const targetDir = await chooseTargetDir(process.cwd(), args.name)
  data = {
    ...data,
    name: args.name || basename(targetDir),
    description: `base on template ${tmpl.title}`,
    template: tmpl.value
  }

  await copyFiles(filesToCopy, tmpl.path, targetDir)
  await renderFiles(filesToRender, tmpl.path, targetDir, {
    create: data
  })
  console.log(style.green('Project created!'))
}
