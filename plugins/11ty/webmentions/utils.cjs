const makeDebug = require('debug')
const sanitizeHTML = require('sanitize-html')

const debug = makeDebug('eleventy-plugin-webmentions:utils')

// in a webmention, the field 'wm-property' can be one of these values:
// https://github.com/snarfed/granary/blob/c6b11da5c1d6cd2ca04738287cc85a8bf9f4eb56/granary/microformats2.py#L554

// https://indieweb.org/like
const isLike = (entry) => entry['wm-property'] === 'like-of'

// https://indieweb.org/reply
const isReply = (entry) =>
  entry['wm-property'] === 'in-reply-to' ||
  entry['wm-property'] === 'mention-of'

// https://indieweb.org/repost
const isRepost = (entry) => entry['wm-property'] === 'repost-of'

/**
 * Sorts in chronological order (oldest to most recent)
 */
const chronologicalOrder = (a, b) => {
  const delta_ms =
    new Date(a.published || a['wm-received']).getTime() -
    new Date(b.published || b['wm-received']).getTime()
  return delta_ms
}

/**
 * Sorts in reverse chronological order (most recent to oldest)
 */
const reverseChronologicalOrder = (a, b) => {
  const delta_ms =
    new Date(b.published || b['wm-received']).getTime() -
    new Date(a.published || a['wm-received']).getTime()
  return delta_ms
}

const makeSanitize = (options) => {
  debug(`options for sanitize-html %O`, options)

  // const fallback_content = 'this webmention has no content'

  return function sanitize(entry) {
    debug(`webmention ${entry['wm-property']} from ${entry['author']['name']}`)

    if (entry.content) {
      if (entry.content.html) {
        const html = sanitizeHTML(entry.content.html, options)
        return { ...entry, content: { ...entry.content, html } }
      } else {
        debug(
          `retrieved a webmention that has no content.html (will use content.text)`
        )
        return entry
      }
    } else {
      debug(`retrieved a webmention that has no content %O`, entry)
      return entry
    }
  }
}

// TODO: (optionally) validate each webmention against a zod schema

const makeResponseToWebmentions = ({ blacklisted, sanitizeOptions }) => {
  const sanitize = makeSanitize(sanitizeOptions)

  return function responseToWebmentions(response) {
    const entries = response.children.filter((entry) => {
      const blocked = blacklisted.some((item) => item.id === entry['wm-id'])
      if (blocked) {
        const reasons = blacklisted.map((item) => item.reason)
        debug(
          `webmention ${entry['wm-id']} is blacklisted because: ${reasons.join(
            ','
          )}`,
          entry
        )
      }
      return !blocked
    })

    const likes = entries.filter(isLike).sort(reverseChronologicalOrder)

    const replies = entries
      .filter(isReply)
      .map(sanitize)
      .sort(reverseChronologicalOrder)

    const reposts = entries
      .filter(isRepost)
      .map(sanitize)
      .sort(reverseChronologicalOrder)

    return { likes, replies, reposts }
  }
}

const sanitizeWebmentionAuthor = (author = {}) => {
  const name = author.name || 'Anonymous'

  const photo =
    author.photo || 'https://bulma.io/images/placeholders/128x128.png'

  const url = author.url || undefined

  return { ...author, name, photo, url }
}

const isTwitterUrl = (s) => {
  const url = new URL(s)
  console.log(`isTwitterUrl`, {
    host: url.host,
    hostname: url.hostname,
    origin: url.origin
  })
  const re = /^https:\/\/twitter\.com\/.*\/status\/\d+/
  return s.match(re) ? true : false
}

module.exports = {
  isLike,
  isReply,
  isRepost,
  isTwitterUrl,
  makeSanitize,
  chronologicalOrder,
  reverseChronologicalOrder,
  makeResponseToWebmentions,
  sanitizeWebmentionAuthor
}
