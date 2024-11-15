import defDebug from 'debug'
import { DEBUG_PREFIX, ERROR_PREFIX } from './constants.mjs'
import { plugin_options } from './schemas.mjs'
import { isTwitterUrl, sanitizeWebmentionAuthor } from './utils.mjs'
import { defClient } from './webmention-io.mjs'

const debug = defDebug(`${DEBUG_PREFIX}:index`)

// TIP: give the plugin configuration function a name, so it can be easily
// spotted in EleventyErrorHandler.
export const webmentionsPlugin = (eleventyConfig, options) => {
  const result = plugin_options.safeParse(options)
  if (!result.success) {
    throw new Error(
      `${ERROR_PREFIX} invalid configuration: ${result.error.message}`
    )
  }

  const {
    blacklisted,
    cacheDirectory,
    cacheDuration,
    cacheVerbose,
    domain,
    sanitizeOptions,
    token
  } = result.data

  debug(`cache responses from Webmention.io %O`, {
    cacheDirectory,
    cacheDuration
  })

  const webmentionsIo = defClient({
    blacklisted,
    cacheDirectory,
    cacheDuration,
    cacheVerbose,
    sanitizeOptions,
    token
  })

  eleventyConfig.addGlobalData('webmentionsSentToDomain', async () => {
    const webmentions = await webmentionsIo.webmentionsSentToDomain(domain)
    debug(
      `added global data 'webmentionsSentToDomain' to eleventy data cascade`
    )
    return webmentions
  })
  debug(`added global data webmentionsSentToDomain`)

  eleventyConfig.addFilter('getDomain', () => domain)
  debug(`added filter getDomain`)

  eleventyConfig.addFilter('isTwitterUrl', isTwitterUrl)
  debug(`added filter isTwitterUrl`)

  eleventyConfig.addFilter('sanitizeWebmentionAuthor', sanitizeWebmentionAuthor)
  debug(`added filter sanitizeWebmentionAuthor`)

  eleventyConfig.addAsyncFilter(
    'webmentionsSentToRelativePath',
    async (relative_path) => {
      const url = new URL(relative_path, `https://${domain}`)
      return await webmentionsIo.webmentionsSentToUrl(url.href)
    }
  )
  debug(`added async filter webmentionsSentToRelativePath`)
}
