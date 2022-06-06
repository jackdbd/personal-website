const fs = require('fs')
const util = require('util')
const readFileAsync = util.promisify(fs.readFile)
const { parse, parseDefaults } = require('himalaya')

const isHtml = (json) => json.tagName === 'html'
const isHead = (json) => json.tagName === 'head'
const children = (json) => json.children
const isStyleTag = (json) => json.tagName === 'style'
const content = (json) => json.content

// for debugging
const tap = (json) => {
  console.log(json)
  return json
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

// styleTagsContents('_site/index.html').then(console.log).catch(console.error);

module.exports = { styleTagsContents }
