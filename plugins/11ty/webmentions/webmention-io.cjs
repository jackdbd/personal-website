const EleventyFetch = require('@11ty/eleventy-fetch')
const makeDebug = require('debug')

const debug = makeDebug('eleventy-plugin-webmentions:webmention.io')

/**
 * Creates an API client that fetches webmentions from webmention.io and caches
 * JSON responses locally.
 *
 * You can retrieve:
 *
 * - all webmentions sent to the subdomain associated with the token (i.e. API
 *   key) webmention.io gave you
 * - all webmentions sent to a specific target (e.g. the URL where a blog post
 *   is hosted at)
 */
const makeClient = ({ cacheDirectory, cacheDuration, cacheVerbose, token }) => {
  const format = 'jf2'
  const endpoint = `https://webmention.io/api/mentions.${format}`

  const webmentionsForSubdomain = async (subdomain) => {
    const url = `${endpoint}?token=${token}`

    debug(`fetch all webmentions sent to ${subdomain}`)
    const response = await EleventyFetch(url, {
      directory: cacheDirectory,
      duration: cacheDuration,
      type: 'json',
      verbose: cacheVerbose
    })
    debug(
      `fetched ${response.children.length} webmentions sent to ${subdomain}`
    )

    return response.children
  }

  const webmentionsForTarget = async (target) => {
    const url = `${endpoint}?token=${token}&target=${target}`

    debug(`fetch all webmentions sent to ${target}`)
    const response = await EleventyFetch(url, {
      directory: cacheDirectory,
      duration: cacheDuration,
      type: 'json',
      verbose: cacheVerbose
    })
    debug(`fetched ${response.children.length} webmentions sent to ${target}`)

    return response.children
  }

  return { webmentionsForSubdomain, webmentionsForTarget }
}

module.exports = { makeClient }
