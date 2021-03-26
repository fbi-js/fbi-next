const { isArray, isObject, deepClone, uniqueElements } = require('./type')

module.exports = (...objs) => {
  // check
  const isArr = objs.every(isArray)
  const isObj = objs.every(isObject)

  if (!isArr && !isObj) {
    throw new Error('can only merge objects or arrays')
  }

  // merge
  return isObj
    ? [...objs].reduce((ret, curr) => {
        if (isObject(curr)) {
          // eslint-disable-next-line array-callback-return
          Object.keys(curr).reduce((_a, k) => {
            // eslint-disable-next-line no-prototype-builtins
            if (ret.hasOwnProperty(k)) {
              ret[k] = isObject(curr[k])
                ? merge(ret[k], curr[k])
                : isArray(curr[k])
                ? uniqueElements(ret[k], curr[k])
                : curr[k]
            } else {
              ret[k] =
                isObject(curr[k]) || isArray(curr[k])
                  ? deepClone(curr[k])
                  : curr[k]
            }
          }, {})
        }
        return ret
      }, {})
    : uniqueElements(objs[0].concat(...objs.slice(1)))
}
