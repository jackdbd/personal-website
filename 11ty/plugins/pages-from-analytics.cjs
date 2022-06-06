// Ideally this would be an eleventy plugin. Or a workbox plugin.
// I am not sure if I can create an eleventy plugin that adds an event handler
// for the eleventy.after event.

const { join } = require('node:path')
const { getBearerToken, makeAnalyticsClient } = require('../../scripts')

const PREFIX = '[📈 pages from analytics] '

const popularPagesFromAnalyticsOrFallback = async ({
  endpoint,
  username,
  password,
  domainId,
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

  try {
    const token = await getBearerToken({
      endpoint,
      username,
      password
    })

    const analytics = makeAnalyticsClient({
      endpoint,
      domainId,
      token
    })

    const results = await analytics.topThreePages()

    console.log(
      `${PREFIX}✅ retrieved ${results.length} most popular pages according to analytics`
    )

    const toPathname = (res) => {
      const pageUrl = new URL(res.id)
      return join(outputDir, pageUrl.pathname, 'index.html')
    }

    return results.map(toPathname)
  } catch (err) {
    console.warn(
      `${PREFIX}⚠️ could not retrieve most popular pages from analytics`
    )
    return fallbackPagesToPrecache
  }
}

module.exports = { popularPagesFromAnalyticsOrFallback }
