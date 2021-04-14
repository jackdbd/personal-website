/**
 * 11ty filters
 * https://www.11ty.dev/docs/filters/
 */
const CleanCSS = require('clean-css');
const { DateTime } = require('luxon');
const slugify = require('slugify');
const UglifyJS = require('uglify-es');

// Minify CSS (used for inlined CSS. Non-inlined CSS is managed by PostCSS)
// I don't (can't?) use cssnano here because it would require a postcss runner.
const cssmin = (code) => {
  return new CleanCSS({
    compatibility: '*',
    level: 2, // if 2  breaks something, try 1
    sourceMap: false
  }).minify(code).styles;
};

// Date formatting (human readable)
const humanDate = (isoString) => {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat('dd LLL yyyy');
};

const humanDateJS = (dateObj) => {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy');
};

// Minify JS (used for inlined JS)
const jsmin = (code) => {
  const minified = UglifyJS.minify(code);
  if (minified.error) {
    console.error('UglifyJS error: ', minified.error);
    return code;
  }
  return minified.code;
};

const limit = (array, n) => {
  return array.slice(0, n);
};

// Date formatting (machine readable)
const machineDate = (isoString) => {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat('yyyy-MM-dd');
};

const machineDateJS = (dateObj) => {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('yyyy-MM-dd');
};

// Create a slug. Useful to create the slugified version of a blog post title.
// TODO: am I really using this filter? I think that 11ty already uses slugify
// automatically.
// https://www.11ty.dev/docs/filters/slug/

module.exports = {
  cssmin,
  humanDate,
  humanDateJS,
  jsmin,
  limit,
  machineDate,
  machineDateJS,
  slugify: function (str) {
    return slugify(str, {
      lower: true,
      replacement: '-',
      remove: /[*+~.·,()'"`´%!?¿:@]/g
    });
  }
};