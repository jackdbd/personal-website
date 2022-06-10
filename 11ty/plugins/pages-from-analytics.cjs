// Ideally this would be an eleventy plugin. Or a workbox plugin.
// I am not sure if I can create an eleventy plugin that adds an event handler
// for the eleventy.after event.

const { join } = require('node:path')
const { readFile } = require('node:fs/promises')

const PREFIX = '[📈 pages from analytics] '

const popularPagesFromAnalyticsOrFallback = async ({
  outputDir,
  defaultPagesToPrecache
}) => {
  let fallbackPagesToPrecache = []
  if (defaultPagesToPrecache === undefined) {
    fallbackPagesToPrecache = [
      join(outputDir, '404.html'),
      join(outputDir, 'about.html'),
      join(outputDir, 'index.html')
    ]
  } else {
    fallbackPagesToPrecache = defaultPagesToPrecache
  }

  const filepath = join(outputDir, 'top-pages.json')
  try {
    // throw new Error('=== Boom ===')
    const json = await readFile(filepath, { encoding: 'utf8' })
    const { ['top_pages']: pagesToPrecache } = JSON.parse(json)
    return pagesToPrecache
  } catch (err) {
    console.error(`${PREFIX}⚠️ could not read file ${filepath}: ${err.message}`)
    return fallbackPagesToPrecache
  }
}

module.exports = { popularPagesFromAnalyticsOrFallback }
