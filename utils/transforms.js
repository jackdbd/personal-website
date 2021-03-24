/**
 * 11ty transforms
 * https://www.11ty.dev/docs/config/#transforms
 */

const htmlmin = require('html-minifier');

const shouldTransformHTML = (outputPath) =>
  outputPath && outputPath.endsWith('.html') && process.env.ELEVENTY_PRODUCTION;

module.exports = {
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
