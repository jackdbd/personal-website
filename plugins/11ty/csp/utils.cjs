const crypto = require('node:crypto')
const makeDebug = require('debug')

const debug = makeDebug('eleventy-plugin-csp/utils')

const isBoolean = (val) => typeof val === 'boolean'

const isObject = (item) => {
  return item && typeof item === 'object' && !Array.isArray(item)
}

const isString = (item) => {
  return item && (typeof item === 'string' || item instanceof String)
}

const mergeDeep = (target, ...sources) => {
  if (!sources.length) {
    return target
  }
  const source = sources.shift()
  // debug(`merge SOURCE %O into TARGET %O`, source, target)

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

// https://bobbyhadz.com/blog/javascript-get-difference-between-two-sets
function diffBetweenSets(setA, setB) {
  return new Set([...setA].filter((elem) => !setB.has(elem)))
}

const stringReplacer = (s) => {
  if (
    s === 'none' ||
    s === 'report-sample' ||
    s === 'script' ||
    s === 'self' ||
    s === 'strict-dynamic' ||
    s === 'unsafe-eval' ||
    s === 'unsafe-hashes' ||
    s === 'unsafe-inline' ||
    s.startsWith('sha')
  ) {
    return s.replace(s, `'${s}'`)
  } else {
    return s
  }
}

const hashAlgorithmFromCspSourceValues = (arr) => {
  const algorithms = arr.filter(
    (s) => s === 'sha256' || s === 'sha384' || s === 'sha512'
  )

  debug(`Hash algorithms found: ${algorithms.join(', ')}`)

  if (algorithms.length === 0) {
    return { value: undefined, error: undefined }
  } else if (algorithms.length === 1) {
    return { value: algorithms[0], error: undefined }
  } else {
    return {
      value: undefined,
      error: new Error(
        `multiple hash algorithms specified (${algorithms.join(', ')})`
      )
    }
  }
}

const contentHash = ({ algorithm, content }) => {
  debug(`Compute ${algorithm}-hash from a string of length ${content.length}`)
  const hasher = crypto.createHash(algorithm)
  return `${algorithm}-${hasher.update(content, 'utf-8').digest('base64')}`
}

module.exports = {
  contentHash,
  diffBetweenSets,
  hashAlgorithmFromCspSourceValues,
  isBoolean,
  isObject,
  isString,
  mergeDeep,
  stringReplacer
}
