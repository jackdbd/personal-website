/**
 * 11ty transforms
 * https://www.11ty.dev/docs/config/#transforms
 */

const htmlmin = require('html-minifier')

// minify HTML files when in production
const shouldTransformHTML = (outputPath) => {
  return (
    outputPath &&
    process.env.ELEVENTY_ENV === 'production' &&
    outputPath.endsWith('.html') &&
    // FIXME: this HTML page is cut if minified. Why? For now I avoid minifying it
    !outputPath.includes('inspect-container-images-with-dive')
  )
}

module.exports = {
  // https://github.com/kangax/html-minifier#options-quick-reference
  htmlmin: function (content, outputPath) {
    if (shouldTransformHTML(outputPath)) {
      return htmlmin.minify(content, {
        collapseWhitespace: true,
        removeComments: true,
        useShortDoctype: true
      })
    } else {
      return content
    }
  }
}
