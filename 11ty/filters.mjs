/**
 * Eleventy filters
 * https://www.11ty.dev/docs/filters/
 *
 * Eleventy provides a number of built-in Nunjucks filters.
 * https://www.11ty.dev/docs/plugins/rss/#supplies-the-following-nunjucks-filters
 *
 * Nunjucks filters
 * https://mozilla.github.io/nunjucks/templating.html#filters
 */
import CleanCSS from 'clean-css'
import makeDebug from 'debug'
import { DateTime } from 'luxon'
import slugifyFn from 'slugify'
import { minify } from 'terser'

const debug = makeDebug(`11ty-config:filters`)

/**
 * Minifies CSS
 *
 * Use this for CSS that you want to inline in the <head> (critical CSS).
 * Non-inlined CSS is managed by PostCSS. I don't (can't?) use cssnano to minify
 * CSS because it would require a postcss runner.
 */
export const cssmin = (code) => {
  return new CleanCSS({
    compatibility: '*',
    level: 2, // if 2  breaks something, try 1
    sourceMap: true
  }).minify(code).styles
}

// Date formatting (human readable)
export const humanDate = (isoString) => {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat('dd LLL yyyy')
}

export const humanDateJS = (dateObj) => {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy')
}

/**
 * Minifies JavaScript using terser.
 *
 * If you are using a Content Security Policy on your website, make sure the
 * script-src directive allows 'unsafe-inline'. Otherwise, your inline
 * Javascript will not load.
 */
export const jsmin = async (code) => {
  const minified = await minify(code, { sourceMap: true })
  if (minified.error) {
    console.log(`!!! terser could not minify JS code`)
    return code
  }
  return minified.code
}

export const limit = (array, n) => {
  return array.slice(0, n)
}

export const log = (value) => {
  console.log('=== LOG ===', value)
  debug(`=== LOG === %O`, value)
}

export const tap = (value) => {
  console.log('=== TAP ===', value)
  debug(`=== TAP === %O`, value)
  return value
}

// Date formatting (machine readable)
export const machineDate = (isoString) => {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat('yyyy-MM-dd')
}

export const machineDateJS = (dateObj) => {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-MM-dd')
}

export const slugify = (str) => {
  return slugifyFn(str, {
    lower: true,
    replacement: '-',
    remove: /[*+~.·,()'"`´%!?¿:@]/g
  })
}

export const arrayFy = (value) => {
  const xs = []
  if (value) {
    if (Array.isArray(value)) {
      xs.push(...value)
    } else {
      xs.push(value)
    }
  }
  return xs
}

export const isFosstodonUrl = (str) => {
  const regex = /https:\/\/fosstodon\.org\/@jackdbd\/[0-9]+/
  return str.match(regex)
}

export const isIndieNewsUrl = (str) => {
  const regex = /https:\/\/news\.indieweb\.org.+/
  return str.match(regex)
}

export const isTelegramUrl = (str) => {
  const regex = /https:\/\/t\.me\/\+.+/
  return str.match(regex)
}

export const urlToHrefAndText = (url) => {
  if (isFosstodonUrl(url)) {
    return { href: url, text: 'Fosstodon' }
  } else if (isIndieNewsUrl(url)) {
    return { href: url, text: 'IndieNews' }
  } else if (isTelegramUrl(url)) {
    return { href: url, text: 'Telegram' }
  } else {
    return { href: url, text: url }
  }
}

export default {
  arrayFy,
  cssmin,
  humanDate,
  humanDateJS,
  isFosstodonUrl,
  isIndieNewsUrl,
  isTelegramUrl,
  jsmin,
  limit,
  log,
  machineDate,
  machineDateJS,
  slugify,
  tap,
  urlToHrefAndText
}
