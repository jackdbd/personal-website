/**
 * 11ty transforms
 * https://www.11ty.dev/docs/config/#transforms
 */

import { minify } from 'html-minifier-terser'

const shouldMinify = (outputPath) => {
  let boolean = false

  if (
    outputPath &&
    process.env.ELEVENTY_ENV === 'production' &&
    outputPath.endsWith('.html') &&
    process.env.ELEVENTY_ENV === 'production'
  ) {
    if (
      outputPath.includes(
        'some-page-that-for-whatever-reason-you-dont-want-to-minify'
      )
    ) {
      boolean = false
      console.log(`[minify-html] ${outputPath} will NOT be minified`)
    } else {
      boolean = true
    }
  }

  return boolean
}

/**
 * Minifies HTML files only in production.
 */
export const htmlmin = (content, outputPath) => {
  if (shouldMinify(outputPath)) {
    // https://github.com/terser/html-minifier-terser#options-quick-reference
    return minify(content, {
      collapseWhitespace: true,
      preserveLineBreaks: true, // removing all line breaks BREAKS a few pages.
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true
    })
  } else {
    return content
  }
}
