/**
 * 11ty filters
 * https://www.11ty.dev/docs/filters/
 */
import CleanCSS from 'clean-css'
import { DateTime } from 'luxon'
import slugifyFn from 'slugify'
import { minify } from 'terser'

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

export default {
  cssmin,
  humanDate,
  humanDateJS,
  jsmin,
  limit,
  log,
  machineDate,
  machineDateJS,
  slugify
}
