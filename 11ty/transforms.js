/**
 * 11ty transforms
 * https://www.11ty.dev/docs/config/#transforms
 */

const htmlmin = require('html-minifier');

// minify HTML files when in production
const shouldTransformHTML = (outputPath) =>
  outputPath &&
  outputPath.endsWith('.html') &&
  process.env.ELEVENTY_ENV === 'production';

module.exports = {
  // https://github.com/kangax/html-minifier#options-quick-reference
  htmlmin: function (content, outputPath) {
    if (shouldTransformHTML(outputPath)) {
      return htmlmin.minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        useShortDoctype: true
      });
    } else {
      return content;
    }
  }
};
