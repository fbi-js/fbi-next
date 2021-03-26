const spawn = require('./spawn')
const isValidArray = arr => Array.isArray(arr) && arr.length > 0

const pathOrAll = arr => (isValidArray(arr) ? arr.join(' ') : '.')
// string to array
const s2a = stdout =>
  stdout
    .trim()
    .split('\n')
    // eslint-disable-next-line no-useless-escape
    .map(b => b.replace(/^[\'\"]+|[\'\"]+$/g, '').trim())
    .filter(l => l.trim())
const strip = str =>
  str
    .trim()
    .replace(/\\\n[ \t]*/g, '')
    .replace(/\\`/g, '`')
    .replace(/\\n/g, '')

const exec = async (str, opts) => {
  const cmd = str
    .split(' ')
    .filter(Boolean)
    .join(' ')
  const ret = await spawn(cmd, {
    shell: true,
    ...opts
  })
  return ret.stdout || ''
}

const root = opts =>
  exec('git rev-parse --show-toplevel', opts)
    .catch(() => process.cwd())
    .then(strip)
const init = opts => exec('git init', opts)
const fetch = (argv, opts) => exec(`git fetch ${argv}`, opts)
const clone = (argv, opts) => exec(`git clone ${argv}`, opts)
const pull = (argv, opts) => exec(`git pull ${argv}`, opts)
const push = (argv, opts) =>
  exec(`git push ${argv || ''} --quiet`, {
    ...(opts || {}),
    stdio: 'inherit'
  })
const add = (arr, opts) => exec(`git add ${pathOrAll(arr)}`, opts)
const del = (arr, opts) =>
  isValidArray(arr)
    ? exec(`git rm ${arr.join(' ')} --ignore-unmatch`, opts)
    : null
const commit = (msg, opts) => {
  const arr = Array.isArray(msg) ? msg : [msg]
  const tmp = [...new Set(arr)].map(s => strip(s))
  const message = tmp.map(str => `-m "${str}"`).join(' ')
  return exec(`git commit ${message}`, opts)
}
const checkout = (arr, opts) =>
  exec(
    `git checkout ${Array.isArray(arr) ? pathOrAll(arr) : arr} --quiet`,
    opts
  )
const merge = (t, argv, opts) => exec(`git merge ${argv} ${t}`, opts)
const clear = opts => exec('git gc', opts)
const clean = opts => exec('git clean -f -d', opts)
const hardReset = (n, opts) => exec(`git reset --hard ${n || 'HEAD'}`, opts)

const status = {
  // info
  isClean: opts =>
    exec(
      'git diff --no-ext-diff --name-only && git diff --no-ext-diff --cached --name-only',
      opts
    )
      .then(s2a)
      .then(str => !!str.trim()),
  untracked: opts =>
    exec('git ls-files --others --exclude-standard', opts).then(s2a),
  modified: opts =>
    exec('git diff --name-only --diff-filter=M', opts).then(s2a),
  deleted: opts => exec('git diff --name-only --diff-filter=D', opts).then(s2a),
  conflicts: opts =>
    exec('git diff --name-only --diff-filter=U', opts).then(s2a),
  staged: opts => exec('git diff --name-only --cached', opts).then(s2a),
  unpushed: opts =>
    exec('git cherry -v', opts)
      .then(s2a)
      .catch(() => []),
  isRebasing: opts =>
    exec('git status', opts).then(
      stdout => stdout && stdout.includes('rebase in progress')
    ),
  conflictStrings: opts => exec('git grep -n "<<<<<<< "', opts).then(s2a),
  conflictFiles: opts =>
    exec('git grep --name-only "<<<<<<< "', opts).then(s2a),
  changes: opts => exec('git status --porcelain', opts).then(s2a),
  needPull: opts => exec('git fetch --dry-run', opts).then(res => !!res),

  // action
  show: opts =>
    exec('git status --short', {
      ...(opts || {}),
      stdio: 'inherit'
    })
}

const stash = {
  // info
  list: opts => exec('git stash list', opts).then(s2a),

  // action
  add: (argv, opts) => exec(`git stash ${argv}`, opts),
  pop: opts => exec('git stash pop', opts),
  clear: opts => exec('git stash clear', opts)
}

const tag = {
  // info
  list: opts => exec('git tag', opts).then(s2a),
  latest: opts => exec('git describe --abbrev=0', opts).catch(_ => ''),

  // action
  add: (n, opts) => exec(`git tag -a ${n}`, opts),
  del: (n, opts) => exec(`git tag -d ${n}`, opts),
  checkout: (n, opts) => exec(`git checkout ${n} --quiet`, opts)
}

const branch = {
  // info
  current: opts =>
    exec('git rev-parse --abbrev-ref HEAD', {
      ...(opts || {}),
      stdio: 'pipe'
    }),
  locals: opts =>
    exec('git branch -vv --format="%(refname:short)"', opts).then(s2a),
  remotes: opts =>
    exec('git branch -vvr --format="%(refname:lstrip=3)"', opts)
      .then(s2a)
      .then(r => r.filter(n => n !== 'HEAD')),
  stales: opts =>
    exec(
      'git branch -vv --format="%(if:equals=gone)%(upstream:track,nobracket)%(then)%(refname:short)%(end)"',
      opts
    ).then(s2a),
  upstream: (n, opts) =>
    exec(`git rev-parse --abbrev-ref ${n || 'HEAD'}@{upstream}`, opts).catch(
      () => false
    ),
  needMerge: (n1, n2, opts) => exec(`git rev-list -1 ${n1} --not ${n2}`, opts),

  // action
  add: (n, from, opts) =>
    exec(`git checkout -b ${n} ${from || ''} --quiet`, opts),
  del: (n, force, opts) => exec(`git branch -${force ? 'D' : 'd'} ${n}`, opts),
  delRemote: (n, opts) => exec(`git push origin --delete ${n}`, opts),
  checkout: (n, opts) => exec(`git checkout ${n} --quiet`, opts)
}

const remoteExist = async (argv, opts) => {
  try {
    await exec(`git ls-remote --exit-code -h ${argv}`, {
      stdio: 'ignore',
      ...opts
    })
    return true
  } catch (err) {
    return false
  }
}

const remoteUrl = async opts => {
  try {
    const url = await exec('git config --get remote.origin.url', {
      cwd: process.cwd(),
      ...opts
    })
    return strip(url)
  } catch (err) {
    return ''
  }
}

module.exports = {
  root,
  init,
  fetch,
  clone,
  pull,
  push,
  add,
  del,
  commit,
  checkout,
  merge,
  clear,
  clean,
  hardReset,
  status,
  stash,
  tag,
  branch,
  remoteExist,
  remoteUrl
}
