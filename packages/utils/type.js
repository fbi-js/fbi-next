const isUndef = val => val == null || val == undefined
const isArray = val => Array.isArray(val)
const isString = val => typeof val === 'string'
const isBoolean = val => typeof val === 'boolean'
const isNumber = val => typeof val === 'number'
const isFunction = val => typeof val === 'function'
const isObject = val => Boolean(val) && val.constructor.name === 'Object'
const isAsyncFunction = val =>
  isFunction(val) && val.constructor.name === 'AsyncFunction'
const isClass = val => {
  const isCtorClass =
    val.constructor && val.constructor.toString().substring(0, 5) === 'class'
  if (isUndef(val.prototype)) {
    return isCtorClass
  }
  const isPrototypeCtorClass =
    val.prototype.constructor &&
    val.prototype.constructor.toString &&
    val.prototype.constructor.toString().substring(0, 5) === 'class'
  return isCtorClass || isPrototypeCtorClass
}
const isValidJSON = val => {
  try {
    JSON.parse(val)
    return true
  } catch (e) {
    return false
  }
}
const isEmpty = val =>
  // val == null || val == undefined || (Object.keys(val) || val).length < 1
  // val == null ||
  // val == undefined
  isUndef(val) ||
  (isArray(val)
    ? val.filter(v => v !== null && v !== undefined).length < 1
    : isObject(val)
    ? Object.keys.length < 1
    : false)
const isValidArray = val => isArray(val) && !isEmpty(val)
const isValidObject = val => isObject(val) && !isEmpty(val)
const isGitUrl = string =>
  // eslint-disable-next-line no-useless-escape
  /(?:git|ssh|https?|git@[-\w.]+):(\/\/)?(.*?)(\.git)(\/?|\#[-\d\w._]+?)$/.test(
    string
  )

const uniqueElements = (...arrs) => {
  const ret = [...arrs].reduce((prev, curr) => {
    if (isArray(curr)) {
      prev = [...prev, ...curr]
    }
    return prev
  }, [])

  return Array.from(new Set(ret))
}

const deepClone = obj => {
  const clone = Object.assign({}, obj)
  Object.keys(clone).forEach(
    key =>
      (clone[key] =
        typeof obj[key] === 'object' ? deepClone(obj[key]) : obj[key])
  )
  return isArray(obj) && obj.length
    ? (clone.length = obj.length) && Array.from(clone)
    : isArray(obj)
    ? Array.from(obj)
    : clone
}

const isWindows = process.platform === 'win32'
const isMacos = process.platform === 'darwin'
const isLinux = process.platform === 'linux'

module.exports = {
  isUndef,
  isArray,
  isString,
  isBoolean,
  isNumber,
  isFunction,
  isObject,
  isAsyncFunction,
  isClass,
  isValidJSON,
  isEmpty,
  isValidArray,
  isValidObject,
  isGitUrl,
  deepClone,
  uniqueElements,
  isWindows,
  isMacos,
  isLinux
}
