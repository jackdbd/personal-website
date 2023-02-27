/**
 * 11ty filters
 * https://www.11ty.dev/docs/filters/
 */
const CleanCSS = require('clean-css')
const { DateTime } = require('luxon')
const slugify = require('slugify')
const { minify } = require('terser')

/**
 * Minifies CSS
 *
 * Use this for CSS that you want to inline in the <head> (critical CSS).
 * Non-inlined CSS is managed by PostCSS. I don't (can't?) use cssnano to minify
 * CSS because it would require a postcss runner.
 */
const cssmin = (code) => {
  return new CleanCSS({
    compatibility: '*',
    level: 2, // if 2  breaks something, try 1
    sourceMap: true
  }).minify(code).styles
}

// Date formatting (human readable)
const humanDate = (isoString) => {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat('dd LLL yyyy')
}

const humanDateJS = (dateObj) => {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy')
}

/**
 * Minifies JavaScript using terser.
 *
 * If you are using a Content Security Policy on your website, make sure the
 * script-src directive allows 'unsafe-inline'. Otherwise, your inline
 * Javascript will not load.
 */
const jsmin = async (code) => {
  const minified = await minify(code, { sourceMap: true })
  if (minified.error) {
    console.log(`!!! terser could not minify JS code`)
    return code
  }
  return minified.code
}

const limit = (array, n) => {
  return array.slice(0, n)
}

const log = (value) => {
  console.log('=== LOG ===', value)
}

// Date formatting (machine readable)
const machineDate = (isoString) => {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat('yyyy-MM-dd')
}

const machineDateJS = (dateObj) => {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-MM-dd')
}

module.exports = {
  cssmin,
  humanDate,
  humanDateJS,
  jsmin,
  limit,
  log,
  machineDate,
  machineDateJS,
  slugify: function (str) {
    return slugify(str, {
      lower: true,
      replacement: '-',
      remove: /[*+~.·,()'"`´%!?¿:@]/g
    })
  }
}
