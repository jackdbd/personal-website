const fs = require('node:fs')
const util = require('node:util')
const makeDebug = require('debug')
const { parse, parseDefaults } = require('himalaya')

const debug = makeDebug('eleventy-plugin-csp/html-parser')

const readFileAsync = util.promisify(fs.readFile)

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
  debug(`Look for <script> tags inlined in <head> in ${filepath}`)
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
  debug(`Look for <style> tags inlined in <head> in ${filepath}`)
  try {
    const html = await readFileAsync(filepath, { encoding: 'utf8' })
    const json = parse(html, { ...parseDefaults, includePositions: false })
    return getStyleTagsContents(json)
  } catch (err) {
    throw new Error(`Could not parse ${filepath}\n${err.message}`)
  }
}

module.exports = {
  scriptTagsContents,
  styleTagsContents
}
