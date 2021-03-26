const { join, basename } = require('path')
const { fs, prompt, isDirEmpty } = require('@fbi-js/utils')
const { templates } = require('./config')

async function chooseTemplate (template) {
  if (template) {
    const exist = templates.find(t => t.value === template)
    if (!exist) {
      throw new Error(`Template '${template}' not exist`)
    }

    return exist
  }

  const { name } = await prompt(
    {
      type: 'select',
      name: 'name',
      message: 'Pick a template',
      choices: templates,
      initial: 0
    },
    {
      onCancel
    }
  )

  return templates.find(t => t.value === name)
}

async function chooseFeatues (features) {
  const { choices } = await prompt(
    {
      type: 'multiselect',
      name: 'choices',
      message: 'Pick features',
      choices: features,
      hint: '- Space to select. Return to submit'
    },
    {
      onCancel
    }
  )

  return choices
}

async function chooseTargetDir (dir = process.cwd(), name, prevDir) {
  let target = dir
  const dirName = basename(prevDir || dir)

  if (!(await isDirEmpty(dir))) {
    const { action } = await prompt(
      {
        type: 'select',
        name: 'action',
        message: `Dir '${dirName}' is not empty, choose an action`,
        choices: [
          {
            title: 'Override',
            value: 'override'
          },
          {
            title: 'New dir',
            value: 'new'
          }
        ],
        initial: 0
      },
      {
        onCancel
      }
    )

    if (action === 'new') {
      if (name) {
        target = join(dir, name)
      } else {
        const { projectName } = await prompt(
          {
            type: 'text',
            name: 'projectName',
            message: 'Input the project name'
          },
          {
            onCancel
          }
        )
        target = join(dir, projectName)
      }

      if (await fs.pathExists(target)) {
        return chooseTargetDir(dir, '', target)
      }
    }
  }

  return target
}

function onCancel () {
  process.exit(0)
}

module.exports = {
  chooseTemplate,
  chooseFeatues,
  chooseTargetDir
}
