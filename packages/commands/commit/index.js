const { join } = require('path')
const {
  fs,
  git,
  style,
  prompt,
  merge,
  spawn,
  isGitRepo,
  argParse,
  resolveConfig,
  isValidArray,
  isWindows
} = require('@fbi-js/utils')

const svBump = require('standard-version/lib/lifecycles/bump')
const svChangelog = require('standard-version/lib/lifecycles/changelog')
const svCommit = require('standard-version/lib/lifecycles/commit')
const svTag = require('standard-version/lib/lifecycles/tag')

const configCommit = require('./configs/commit.json')
const configRelease = require('./configs/release.json')

let gitCommandOptions = {}
const defaults = {
  repoPath: process.cwd()
}
let configs = {
  commit: {
    types: [],
    scopes: []
  },
  release: {}
}

module.exports = async function commit () {
  const args = argParse(process.argv.slice(2))
  console.log('running fbi-commit', args)
  // prevent additional parameters results in an git error
  process.argv = process.argv.slice(0, 3)
  const config = resolveConfig()
  getConfigs(config)
  const options = defaults
  const pkg = await getPkg()

  if (!(await isGitRepo(options.repoPath))) {
    await gitInit()
  }

  gitCommandOptions = {
    // exec all git commands in git top-root dir
    cwd: (await git.root()) || process.cwd()
  }

  const hadCommited = await gitCommit(options)
  if (hadCommited) {
    console.log('Selected files committed\n')
  }

  const { prerelease } = await bumpVersion(pkg)

  // push
  const unPushed = await git.status.unpushed(gitCommandOptions)
  if (unPushed.length > 0) {
    console.log()
    console.log(`Unpushed commits(${unPushed.length}):`)
    console.log(unPushed.join('\n'))

    const answer = await prompt({
      type: 'confirm',
      name: 'pushCommits',
      message: 'Do you want to push now?',
      initial: false
    })

    if (answer.pushCommits) {
      await git.push('', gitCommandOptions)
      await git.push('--tags', gitCommandOptions)
      console.log('All commits and tags pushed\n')
    }
  }

  // publish
  if (pkg && !pkg.private) {
    await publish(pkg, prerelease)
  }

  // status
  await git.status.changes()
  const unPushed2 = await git.status.unpushed(gitCommandOptions)
  if (unPushed2) {
    console.log(` (${unPushed2.length} commits unpushed)`)
  }
  console.log()
}

function getConfigs (config) {
  const { commit, release } = config
  // validate
  if (commit && !isObject(commit)) {
    console.error('config "commit" should be a json object')
    process.exit()
  }
  if (release && !isObject(release)) {
    console.error('config "release" should be a json object')
    process.exit()
  }

  configs = {
    commit: merge(configCommit, commit || { types: [], scopes: [] }),
    release: merge(configRelease, release || {})
  }
}

async function gitInit () {
  const answer = await prompt({
    type: 'confirm',
    name: 'initNow',
    message: 'This is not a git repository. "git init" now?',
    initial: false
  })

  if (answer && answer.initNow) {
    return git.init()
  }

  process.exit(0)
}

async function gitCommit (options) {
  try {
    const needAdd = await git.status.changes(gitCommandOptions)
    const unPushed = await git.status.unpushed(gitCommandOptions)
    if (isValidArray(unPushed)) {
      console.log(style.yellow(`${unPushed.length} commits unpushed`))
    }

    if (needAdd.length > 0) {
      // select files to add
      const answer = await prompt({
        type: 'multiselect',
        name: 'files',
        message: 'select files staged for commit:',
        choices: needAdd.map(n => ({ value: n })),
        limit: 15
      })

      if (answer?.files?.length > 0) {
        let filesToDel = []
        const filesToAdd = answer.files
          .map(file => {
            const [status, ...paths] = file.split(' ')
            if (status === 'D') {
              filesToDel.push(paths.pop())
              return null
            }
            return paths.pop()
          })
          .filter(Boolean)

        // add
        await git.add(filesToAdd, gitCommandOptions)
        // remove
        await git.del(filesToDel, gitCommandOptions)

        const message = await promptCommit()
        await git.commit(message, gitCommandOptions)
        return true
      }
    }

    const hasStaged = await git.status.staged(gitCommandOptions)
    if (hasStaged.length > 0) {
      const message = await promptCommit()
      await git.commit(message, gitCommandOptions)
      return true
    } else {
      console.log(style.cyan('nothing to commit, working tree clean'))
    }
  } catch (err) {
    throw err
  }
}

async function bumpVersion (pkg) {
  const answerBump = await prompt({
    type: 'confirm',
    name: 'bumpVersion',
    message: 'Bump the package version?',
    initial: false
  })

  if (!answerBump.bumpVersion) {
    return { prerelease: false }
  }

  const oldVersion =
    (pkg && pkg.version) || (await git.tag.latest(gitCommandOptions))
  if (!oldVersion) {
    await standardVersion({ ...configRelease, firstRelease: true })
    console.log(`current version is ${oldVersion}`)
    console.log(
      `new version: ${style.bold(await git.tag.latest(gitCommandOptions))}`
    )
    return { prerelease: false }
  }
  console.log(`current version is ${style.bold(oldVersion)}`)

  // select bump type
  let tagNames = ['alpha', 'beta', 'rc', '']
  const prerelease = tagNames.filter(t => !!t).find(t => oldVersion.includes(t))
  if (prerelease) {
    const idx = tagNames.findIndex(t => t === prerelease)
    tagNames = tagNames.slice(idx + 1)
  } else {
    tagNames = ['alpha', '']
  }
  let releaseTypes = prerelease ? ['patch'] : ['patch', 'minor', 'major']

  const opts = {
    ...configRelease,
    dryRun: true
  }

  const recommendedVersion = await svBump(
    { ...opts, ...(prerelease ? { prerelease } : {}) },
    oldVersion
  )

  const bumps = []
  for (const tag of tagNames) {
    for (const type of releaseTypes) {
      bumps.push(
        await svBump(
          tag
            ? {
                ...opts,
                releaseAs: type,
                prerelease: tag
              }
            : {
                ...opts,
                releaseAs: type
              },
          oldVersion
        ).then(newVersion => ({
          name: `${type} ${tag}`,
          message: newVersion,
          hint: `${type} ${tag}`
        }))
      )
    }
  }

  const choices = [
    {
      name: ` ${prerelease || ''}`,
      message: recommendedVersion,
      hint: 'recommended'
    },
    ...bumps
  ]

  const anwser = await prompt({
    type: 'select',
    name: 'version',
    message: 'How would you like to bump it?',
    choices,
    pageSize: 20
  })

  const results = anwser.version.split(' ')
  const options = {
    ...configRelease,
    ...(results[0] ? { releaseAs: results[0] } : {}),
    ...(results[1] ? { prerelease: results[1] } : {})
  }
  const newVersion = await svBump(options, oldVersion)
  await svChangelog(options, newVersion)
  await svCommit(options, newVersion)
  await svTag(newVersion, pkg ? pkg.private : false, options)

  console.log(`new version: ${style.bold(newVersion)}`)

  return {
    prerelease,
    newVersion
  }
}

async function publish (pkg, prerelease) {
  if (!pkg || !pkg.name) {
    console.error('Invalid package.json')
    process.exit()
  }

  const answer = await prompt({
    type: 'confirm',
    name: 'npmPublish',
    message: 'Publish to npmjs.com ?'
  })

  if (!answer || !answer.npmPublish) {
    return
  }

  let cmd = 'npm publish'
  const response = await prompt({
    type: 'text',
    name: 'npmTag',
    message: 'Input the npm tag',
    initial: prerelease ? 'next' : 'latest'
  })
  if (response?.npmTag) {
    cmd += ` --tag ${response.npmTag}`
  }

  if (pkg.name.startsWith('@')) {
    const answerPub = await prompt({
      type: 'confirm',
      name: 'public',
      message: 'This is a scoped package, publish as public ?',
      initial: true
    })

    if (answerPub && answerPub.public) {
      cmd += ' --access=public'
    }
  }

  await spawn(cmd, {
    cwd: process.cwd()
  })
  console.log('Publish successfully\n')
}

async function getPkg () {
  const pkgPath = join(process.cwd(), 'package.json')
  if (await fs.pathExists(pkgPath)) {
    return require(pkgPath)
  }
  return null
}

async function promptCommit () {
  const { commit } = configs
  const questions = [
    {
      type: 'select',
      name: 'type',
      message: 'type of change      (required):',
      choices: typeChoices(commit.types)
    },
    isValidArray(commit.scopes)
      ? {
          type: 'select',
          name: 'scope',
          message: 'affected scope      (required):',
          choices: commit.scopes.map(name => ({
            name
          }))
        }
      : {
          type: 'text',
          name: 'scope',
          message: 'affected scope      (optional):'
        },
    {
      type: 'text',
      name: 'subject',
      message: 'short description   (required):',
      validate (answer) {
        return !answer.trim() ? 'Please write a short description' : true
      }
    },
    {
      type: 'text',
      name: 'body',
      message: 'longer description  (optional):'
      // \n - first \n - second \n - third
    },
    {
      type: 'text',
      name: 'issues',
      message: 'issue closed        (optional):'
    },
    {
      type: 'text',
      name: 'breaking',
      message: 'breaking change     (optional):'
    }
  ]

  const answer = await prompt(questions)

  // format
  const scope = answer.scope ? '(' + answer.scope.trim() + ')' : ''
  const subject = answer.subject && answer.subject.trim()
  const body = answer.body && answer.body.trim()
  const issues = answer.issues && answer.issues.trim()
  let breaking = answer.breaking && answer.breaking.trim()

  let messages = []

  messages.push(answer.type + scope + ': ' + subject)
  if (body) {
    messages = messages.concat(body.split(';'))
  }
  if (issues) {
    const issuesIds = issues.match(/#\d+/g)
    if (issuesIds) {
      messages.push(issuesIds.map(id => `fixed ${id}`).join(', '))
    }
  }

  breaking = breaking
    ? 'BREAKING CHANGE: ' + breaking.replace(/^BREAKING CHANGE: /, '')
    : ''
  if (breaking) {
    messages = messages.concat(breaking.split(';'))
  }

  return messages.map(msg => msg.trim()).filter(Boolean)
}

function typeChoices (types) {
  const maxNameLength = types.reduce(
    (maxLength, type) =>
      type.name.length > maxLength ? type.name.length : maxLength,
    0
  )

  return types.map(choice => ({
    value: choice.name,
    description: `${choice.name.padEnd(maxNameLength, ' ')}  ${
      isWindows ? ':' : choice.emoji || ':'
    }  ${choice.description}`
  }))
}
