const fs = require('node:fs')
const path = require('node:path')
const util = require('node:util')
const makeDebug = require('debug')
// https://adamcoster.com/blog/commonjs-and-esm-importexport-compatibility-examples
const globbyPromise = import('globby')
const { deprecatedDirectives } = require('./constants.cjs')
const {
  mergeDeep,
  sha256FromString,
  sha512FromString,
  scriptTagsContents,
  stringReplacer,
  styleTagsContents
} = require('./utils.cjs')
const {
  defaultOptions,
  pluginOptions: optionsSchema
} = require('./schemas.cjs')

const writeFileAsync = util.promisify(fs.writeFile)

const debug = makeDebug('eleventy-plugin-csp')

const PREFIX = '[👮 11ty-plugin-csp]'

// give the plugin configuration function a name, so it can be easily spotted in
// EleventyErrorHandler
const contentSecurityPolicy = (eleventyConfig, providedOptions) => {
  // https://joi.dev/api/?v=17.6.0#anyvalidatevalue-options
  const result = optionsSchema.validate(providedOptions, {
    // allowUnknown: true
    // debug: true
  })

  const pluginConfig = {}
  mergeDeep(pluginConfig, defaultOptions, providedOptions)

  if (result.error) {
    const detail = result.error.details[0]

    if (detail.path.length === 2) {
      const directive = detail.path[1]
      //   const value = detail.context.value
      const deprecatedDirective = deprecatedDirectives[directive]
      if (deprecatedDirective) {
        const message = [
          `CSP directive ${directive} is deprecated`,
          `Instead, ${deprecatedDirective.whatToDoInstead}`,
          `Learn more: ${deprecatedDirective.hrefs.join(' ')}`
        ].join('\n')
        if (pluginConfig.allowDeprecatedDirectives) {
          console.warn(`${PREFIX} === === ===\n${message}\n=== === === ===`)
        } else {
          const tip = `Remove the deprecated directives, or set allowDeprecatedDirectives: true if you want to allow them.`
          throw new Error(`${PREFIX} invalid configuration: ${message}. ${tip}`)
        }
      } else {
        // This is an error about a CSP directives, but it's not related to a
        // deprecated directive.
        const message = `${PREFIX} invalid configuration: ${result.error.message}`
        throw new Error(message)
      }
    } else {
      // This is an error about something else in the plugin configuration.
      const message = `${PREFIX} invalid configuration: ${result.error.message}`
      throw new Error(message)
    }
  }

  const style_src = pluginConfig.directives['style-src']

  let idxStyleSrc
  if (style_src) {
    idxStyleSrc = style_src.indexOf('sha256')
    if (idxStyleSrc !== -1) {
      debug(
        `Found sha256 at index ${idxStyleSrc} in style-src directive => generate base64-encoded SHA-256 hash for each inlined CSS.`
      )
    }
    // array.at() requires Node.js 16.8 or later
    // https://node.green/#ES2022-features--at---method-on-the-built-in-indexables
  }

  eleventyConfig.on('eleventy.after', async () => {
    const outdir = eleventyConfig.dir.output

    const headersFilepath = path.join(outdir, '_headers')

    const module = await globbyPromise
    const globby = module.globby

    // const includePatterns = [`${outdir}/**/**.html`]
    // const includePatterns = [
    //   `${outdir}/projects/index.html`,
    //   `${outdir}/tags/index.html`
    // ]
    // debug(`Include patterns %O`, includePatterns)

    // const excludePatterns = [
    //   `!${outdir}/about/index.html`,
    //   `!${outdir}/contact/index.html`
    // ]
    // const excludePatterns = []
    // debug(`Exclude patterns %O`, excludePatterns)

    // const patterns = includePatterns.concat(excludePatterns)
    const patterns = [`${outdir}/**/**.html`]

    // https://github.com/sindresorhus/globby
    const paths = await globby(patterns)
    debug(
      `Found ${paths.length} HTML ${
        paths.length === 1 ? 'file' : 'files'
      } matching these patterns %O`,
      patterns
    )

    const relatives = paths.map((p) => path.relative(outdir, p))
    debug('relatives %O', relatives)

    const promises = paths.map(async (filepath) => {
      const jsContents = await scriptTagsContents(filepath)

      const cssContents = await styleTagsContents(filepath)

      return {
        filepath,
        hashes: {
          'script-src': jsContents.map((s) => sha256FromString(s)),
          'style-src': cssContents.map((s) => sha256FromString(s))
        }
      }
    })

    const things = await Promise.all(promises)

    const hashesForInlineScriptTags = things.flatMap(
      (d) => d.hashes['script-src']
    )
    const hashesForInlineScriptTagsUnique = [
      ...new Set(hashesForInlineScriptTags)
    ]
    console.log(
      '=== hashesForInlineScriptTagsUnique ===',
      hashesForInlineScriptTagsUnique
    )

    const hashesForInlineStyleTags = things.flatMap(
      (d) => d.hashes['style-src']
    )

    const hashesForInlineStyleTagsUnique = [
      ...new Set(hashesForInlineStyleTags)
    ]

    pluginConfig.directives['style-src'].splice(
      idxStyleSrc,
      1,
      ...hashesForInlineStyleTagsUnique
    )

    // console.log('style-src AFTER splice', pluginConfig.directives['style-src'])

    const contents = await scriptTagsContents(path.join(outdir, 'index.html'))
    const hashes = contents.map((s) => sha256FromString(s))
    debug(`hashes for <script> tags %O`, hashes)

    if (!fs.existsSync(headersFilepath)) {
      fs.writeFileSync(headersFilepath, '', { encoding: 'utf8' })
      debug(`${headersFilepath} did not exist, so it was created`)
    }

    debug('directives before %O', pluginConfig.directives)
    const directives = Object.entries(pluginConfig.directives).map(
      ([key, value]) => {
        // debug(`${key} %o`, value)
        if (value === true) {
          return key
        }
        const strings = value.map(stringReplacer)
        return `${key} ${strings.join(' ')}`
      }
    )
    debug('directives after %O', directives)

    // this is useful for troubleshooting the CSP and/or make it easier to
    // consume by other tools (e.g. send a Telegram message containing the
    // current CSP directives)
    await writeFileAsync(
      path.join(outdir, 'eleventy-plugin-csp-config.json'),
      JSON.stringify(pluginConfig, null, 2)
    )

    const headerKey = pluginConfig.reportOnly
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy'

    const headerValue = directives.join('; ')

    pluginConfig.globPatterns.forEach((pattern) => {
      debug(`add ${headerKey} header for resources matching ${pattern}`)
      fs.appendFileSync(
        headersFilepath,
        `\n${pattern}\n  ${headerKey}: ${headerValue}\n`
      )
    })

    pluginConfig.globPatternsDetach.forEach((pattern) => {
      debug(`remove ${headerKey} header for resources matching ${pattern}`)
      fs.appendFileSync(headersFilepath, `\n${pattern}\n  ! ${headerKey}\n`)
    })
  })
}

module.exports = { initArguments: {}, configFunction: contentSecurityPolicy }
