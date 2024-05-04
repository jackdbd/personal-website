import EleventyFetch from '@11ty/eleventy-fetch'
import defDebug from 'debug'
import { DEBUG_PREFIX } from './constants.mjs'
import { defResponseToWebmentions } from './utils.mjs'

const debug = defDebug(`${DEBUG_PREFIX}:webmention.io`)

// TODO: export individual functions to better test them / compose them

/**
 * Creates an API client that fetches webmentions from webmention.io and caches
 * JSON responses locally.
 *
 * You can retrieve:
 *
 * - all webmentions sent to the domain associated with the token (i.e. API key) webmention.io gave you
 * - all webmentions sent to a specific target (e.g. the URL where a blog post
 *   is hosted at)
 *
 * @see https://github.com/aaronpk/webmention.io
 */
export const defClient = ({
  blacklisted,
  cacheDirectory,
  cacheDuration,
  cacheVerbose,
  sanitizeOptions,
  token
}) => {
  // https://www.w3.org/wiki/JF2
  const format = 'jf2'
  const endpoint = `https://webmention.io/api/mentions.${format}`

  const responseToWebmentions = defResponseToWebmentions({
    blacklisted,
    sanitizeOptions
  })

  // TODO: pagination
  // https://github.com/aaronpk/webmention.io#paging

  const webmentionsSentToDomain = async (domain) => {
    const pagination = { page: 0, per_page: 100 }
    debug(`retrieve webmentions sent to ${domain} %O`, pagination)

    const response = await EleventyFetch(
      `${endpoint}?page=${pagination.page}&per-page=${pagination.per_page}&token=${token}`,
      {
        directory: cacheDirectory,
        duration: cacheDuration,
        type: 'json',
        verbose: cacheVerbose
      }
    )

    const { likes, replies, reposts } = responseToWebmentions(response)

    if (response.children.length) {
      debug(
        `${
          likes.length + replies.length + reposts.length
        } webmentions sent to ${domain} (after blacklisting and HTML sanitization) %o`,
        {
          likes: likes.length,
          replies: replies.length,
          reposts: reposts.length
        }
      )
    }

    return { likes, replies, reposts }
  }

  const webmentionsSentToUrl = async (url) => {
    const pagination = { page: 0, per_page: 100 }

    const response = await EleventyFetch(
      `${endpoint}?page=${pagination.page}&per-page=${pagination.per_page}&target=${url}&token=${token}`,
      {
        directory: cacheDirectory,
        duration: cacheDuration,
        type: 'json',
        verbose: cacheVerbose
      }
    )

    const { likes, replies, reposts } = responseToWebmentions(response)

    if (response.children.length) {
      debug(
        `${
          likes.length + replies.length + reposts.length
        } webmentions sent to ${url} (after blacklisting and HTML sanitization) %o`,
        {
          likes: likes.length,
          replies: replies.length,
          reposts: reposts.length
        }
      )
    }

    return { likes, replies, reposts }
  }

  return { webmentionsSentToDomain, webmentionsSentToUrl }
}
