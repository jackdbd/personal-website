const makeDebug = require('debug')
const sanitizeHTML = require('sanitize-html')

const debug = makeDebug('eleventy-plugin-webmentions:utils')

const isLike = (entry) => entry['wm-property'] === 'like-of'

const isReply = (entry) =>
  entry['wm-property'] === 'in-reply-to' ||
  entry['wm-property'] === 'mention-of'

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

  return function sanitize(entry) {
    debug(`webmention ${entry['wm-property']} from ${entry['author']['name']}`)
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

module.exports = {
  isLike,
  isReply,
  isRepost,
  makeSanitize,
  chronologicalOrder,
  reverseChronologicalOrder
}
