/**
 * 11ty filters
 * https://www.11ty.dev/docs/filters/
 */

const CleanCSS = require('clean-css');
const { DateTime } = require('luxon');
const slugify = require('slugify');
const UglifyJS = require('uglify-es');

// Date formatting (human readable)
const humanDate = (isoString) => {
  return DateTime.fromISO(isoString, { zone: 'utc' }).toFormat('dd LLL yyyy');
};

const humanDateJS = (dateObj) => {
  return DateTime.fromJSDate(dateObj, { zone: 'utc' }).toFormat('dd LLL yyyy');
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

// Minify CSS (used for inlined CSS. Non-inlined CSS is managed by PostCSS)
// TODO: replace with cssnano (it's already used in the postcss pipeline for Tailwind CSS)
const cssmin = (code) => {
  return new CleanCSS({
    compatibility: '*',
    level: 2, // if 2  breaks something, try 1
    sourceMap: false
  }).minify(code).styles;
};

// Minify JS (used for inlined JS)
const jsmin = (code) => {
  const minified = UglifyJS.minify(code);
  if (minified.error) {
    console.log('UglifyJS error: ', minified.error);
    return code;
  }
  return minified.code;
};

// Create a slug. Useful to create the slugified version of a blog post title.
// TODO: am I really using this filter? I think that 11ty already uses slugify
// automatically.
// https://www.11ty.dev/docs/filters/slug/

module.exports = {
  humanDate,
  humanDateJS,
  limit,
  machineDate,
  machineDateJS,
  cssmin,
  jsmin,
  slugify: function (str) {
    return slugify(str, {
      lower: true,
      replacement: '-',
      remove: /[*+~.·,()'"`´%!?¿:@]/g
    });
  }
};
