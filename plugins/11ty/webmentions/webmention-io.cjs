const EleventyFetch = require('@11ty/eleventy-fetch')
const makeDebug = require('debug')
const {
  isLike,
  isReply,
  isRepost,
  makeSanitize,
  reverseChronologicalOrder
} = require('./utils.cjs')

const debug = makeDebug('eleventy-plugin-webmentions:webmention.io')

/**
 * Creates an API client that fetches webmentions from webmention.io and caches
 * JSON responses locally.
 *
 * You can retrieve:
 *
 * - all webmentions sent to the domain associated with the token (i.e. API key) webmention.io gave you
 * - all webmentions sent to a specific target (e.g. the URL where a blog post
 *   is hosted at)
 */
const makeClient = ({
  cacheDirectory,
  cacheDuration,
  cacheVerbose,
  sanitizeOptions,
  token
}) => {
  const format = 'jf2'
  const endpoint = `https://webmention.io/api/mentions.${format}`

  const sanitize = makeSanitize(sanitizeOptions)

  const webmentionsForUrl = async (url) => {
    const response = await EleventyFetch(url, {
      directory: cacheDirectory,
      duration: cacheDuration,
      type: 'json',
      verbose: cacheVerbose
    })

    debug(`fetched ${response.children.length} webmentions sent to ${url}`)

    const likes = response.children.filter(isLike)
    const replies = response.children.filter(isReply)
    const reposts = response.children.filter(isRepost)

    return [
      ...likes.sort(reverseChronologicalOrder),
      ...replies.map(sanitize).sort(reverseChronologicalOrder),
      ...reposts.map(sanitize).sort(reverseChronologicalOrder)
    ]
  }

  const webmentionsForDomain = async (domain) => {
    // debug(`fetch all webmentions sent to ${domain}`)
    return webmentionsForUrl(`${endpoint}?token=${token}`)
  }

  const webmentionsForTarget = async (target) => {
    // debug(`fetch all webmentions sent to ${target}`)
    return webmentionsForUrl(`${endpoint}?token=${token}&target=${target}`)
  }

  return { webmentionsForDomain, webmentionsForTarget }
}

module.exports = { makeClient }
