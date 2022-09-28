const makeDebug = require('debug')

const debug = makeDebug('eleventy-plugin-csp/utils')

const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

// TODO: use hapi.hoek apply to defaults (or mergerino, etc)

const mergeDeep = (target, ...sources) => {
  if (!sources.length) {
    return target
  }
  const source = sources.shift()
  debug(`merge SOURCE %O into TARGET %O`, source, target)

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key])
          Object.assign(target, {
            [key]: {}
          })
        mergeDeep(target[key], source[key])
      } else {
        Object.assign(target, {
          [key]: source[key]
        })
      }
    }
  }

  return mergeDeep(target, ...sources)
}

module.exports = {
  mergeDeep
}
