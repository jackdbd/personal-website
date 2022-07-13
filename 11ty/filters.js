/**
 * 11ty filters
 * https://www.11ty.dev/docs/filters/
 */
const CleanCSS = require('clean-css')
const { DateTime } = require('luxon')
const slugify = require('slugify')
const UglifyJS = require('uglify-es')

// Minify CSS (used for inlined CSS. Non-inlined CSS is managed by PostCSS)
// I don't (can't?) use cssnano here because it would require a postcss runner.
const cssmin = (code) => {
  return new CleanCSS({
    compatibility: '*',
    level: 2, // if 2  breaks something, try 1
    sourceMap: false
  }).minify(code).styles
}

// Date formatting (human readable)
const humanDate = (isoString) => {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat('dd LLL yyyy')
}

const humanDateJS = (dateObj) => {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy')
}

// Minify JS (used for inlined JS)
// I would like to use terser, but terser exposes a single async function, and
// at the moment 11ty filters can't be asynchronous.
// https://github.com/11ty/eleventy/issues/518
// TODO: I might try to de-async terser using this package
// https://github.com/abbr/deasync
const jsmin = (code) => {
  const minified = UglifyJS.minify(code)
  if (minified.error) {
    console.error('UglifyJS error: ', minified.error)
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
