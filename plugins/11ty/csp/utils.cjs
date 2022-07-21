const fs = require('node:fs')
const crypto = require('node:crypto')
const util = require('node:util')
const makeDebug = require('debug')
const { parse, parseDefaults } = require('himalaya')

const debug = makeDebug('eleventy-plugin-csp/utils')

const readFileAsync = util.promisify(fs.readFile)

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

const isHtml = (json) => json.tagName === 'html'
const isHead = (json) => json.tagName === 'head'
const children = (json) => json.children
const isScriptTag = (json) => json.tagName === 'script'
const isStyleTag = (json) => json.tagName === 'style'
const content = (json) => json.content

// for debugging
const tap = (json) => {
  console.log('=== Himalaya tap ===')
  console.log(json)
  return json
}

const getScriptTagsContents = (json) => {
  // .map(tap)
  return json
    .filter(isHtml)
    .flatMap(children)
    .filter(isHead)
    .flatMap(children)
    .filter(isScriptTag)
    .flatMap(children)
    .map(content)
}

const getStyleTagsContents = (json) => {
  // .map(tap)
  return json
    .filter(isHtml)
    .flatMap(children)
    .filter(isHead)
    .flatMap(children)
    .filter(isStyleTag)
    .flatMap(children)
    .map(content)
}

const scriptTagsContents = async (filepath) => {
  try {
    const html = await readFileAsync(filepath, { encoding: 'utf8' })
    const json = parse(html, { ...parseDefaults, includePositions: false })
    return getScriptTagsContents(json)
  } catch (err) {
    throw new Error(`Could not parse ${filepath}\n${err.message}`)
  }
}

// filepath: fullpath to the HTML file to parse.
// https://github.com/andrejewski/himalaya/blob/master/text/ast-spec-v1.md
// https://github.com/andrejewski/himalaya/blob/f0b870011b84da362c863dc914157f30d4a603ac/src/index.js#L12
const styleTagsContents = async (filepath) => {
  try {
    const html = await readFileAsync(filepath, { encoding: 'utf8' })
    const json = parse(html, { ...parseDefaults, includePositions: false })
    return getStyleTagsContents(json)
  } catch (err) {
    throw new Error(`Could not parse ${filepath}\n${err.message}`)
  }
}

// TODO: add info about string. E.g. the string YOUTUBE_EMBED_DIV_INLINE_STYLE
// could hava the description: youtube-embed-div-container-inline-style
const makeHashFromString = (hashAlgorithm) => {
  return function hashFromString(str) {
    const hasher = crypto.createHash(hashAlgorithm)
    return `${hashAlgorithm}-${hasher.update(str, 'utf-8').digest('base64')}`
  }
}

const stringReplacer = (s) => {
  if (
    s === 'none' ||
    s === 'report-sample' ||
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

module.exports = {
  diffBetweenSets,
  sha256FromString: makeHashFromString('sha256'),
  sha384FromString: makeHashFromString('sha384'),
  sha512FromString: makeHashFromString('sha512'),
  isBoolean,
  isObject,
  isString,
  mergeDeep,
  scriptTagsContents,
  stringReplacer,
  styleTagsContents
}
