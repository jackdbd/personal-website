const EleventyFetch = require('@11ty/eleventy-fetch')
const makeDebug = require('debug')
const sanitizeHTML = require('sanitize-html')

const debug = makeDebug('eleventy-plugin-webmentions:webmention.io')

const isLike = (entry) => entry['wm-property'] === 'like-of'

const isReply = (entry) =>
  entry['wm-property'] === 'in-reply-to' ||
  entry['wm-property'] === 'mention-of'

const isRepost = (entry) => entry['wm-property'] === 'repost-of'

const makeSanitize = (options) => {
  debug(`options for sanitize-html %O`, options)

  return function sanitize(entry) {
    debug(`${entry['wm-property']} from ${entry['author']['name']}`)
    if (entry.content) {
      if (entry.content.html) {
        const html = sanitizeHTML(entry.content.html, options)
        return { ...entry, content: { ...entry.content, html } }
      } else {
        // console.log(`=== webmention entry with no content.html ===`, entry)
        return entry
      }
    } else {
      // console.log(`=== webmention entry with no content ===`, entry)
      return entry
    }
  }
}

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

  const webmentionsForDomain = async (domain) => {
    const url = `${endpoint}?token=${token}`

    debug(`fetch all webmentions sent to ${domain}`)
    const response = await EleventyFetch(url, {
      directory: cacheDirectory,
      duration: cacheDuration,
      type: 'json',
      verbose: cacheVerbose
    })
    debug(`fetched ${response.children.length} webmentions sent to ${domain}`)

    const likes = response.children.filter(isLike)
    const replies = response.children.filter(isReply)
    const reposts = response.children.filter(isRepost)

    return [...likes, ...replies.map(sanitize), ...reposts.map(sanitize)]
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

    const likes = response.children.filter(isLike)
    const replies = response.children.filter(isReply)
    const reposts = response.children.filter(isRepost)

    return [...likes, ...replies.map(sanitize), ...reposts.map(sanitize)]
  }

  return { webmentionsForDomain, webmentionsForTarget }
}

module.exports = { makeClient }
