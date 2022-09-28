const fs = require('node:fs')
const path = require('node:path')
const util = require('node:util')
const makeDebug = require('debug')
// https://adamcoster.com/blog/commonjs-and-esm-importexport-compatibility-examples
const cspPromise = import('@jackdbd/content-security-policy')
const {
  defaultOptions,
  pluginOptions: optionsSchema
} = require('./schemas.cjs')
const { mergeDeep } = require('./utils.cjs')

const debug = makeDebug('eleventy-plugin-csp')

const writeFileAsync = util.promisify(fs.writeFile)

// give the plugin configuration function a name, so it can be easily spotted in
// EleventyErrorHandler
const contentSecurityPolicy = (eleventyConfig, providedOptions) => {
  // https://joi.dev/api/?v=17.6.0#anyvalidatevalue-options
  const result = optionsSchema.validate(providedOptions, {
    allowUnknown: true
  })

  const pluginConfig = {}
  mergeDeep(pluginConfig, defaultOptions, providedOptions)

  const outdir = eleventyConfig.dir.output
  const headersFilepath = path.join(outdir, '_headers')

  const patterns = [
    ...pluginConfig.includePatterns.map((pattern) => `${outdir}${pattern}`),
    ...pluginConfig.excludePatterns.map((pattern) => `!${outdir}${pattern}`)
  ]
  debug(
    `will look for inlined JS/CSS in HTML pages matching these patterns %O`,
    patterns
  )

  eleventyConfig.on('eleventy.after', async () => {
    // const module = await cspPromise
    const { cspDirectives, cspJSON, validationErrorOrWarnings } =
      await cspPromise

    if (result.error) {
      const { error, warnings } = validationErrorOrWarnings({
        allowDeprecatedDirectives: pluginConfig.allowDeprecatedDirectives,
        error: result.error
      })
      if (error) {
        throw error
      } else {
        warnings.forEach((w) => {
          console.warn(w)
        })
      }
    }

    const directives = await cspDirectives({
      directives: pluginConfig.directives,
      patterns
    })

    // const headerValue = await cspHeader({
    //   directives: pluginConfig.directives,
    //   patterns
    // })

    // const cspObj = await cspJSON({
    //   directives: pluginConfig.directives,
    //   patterns
    // })

    if (!fs.existsSync(headersFilepath)) {
      fs.writeFileSync(headersFilepath, '', { encoding: 'utf8' })
      debug(`${headersFilepath} did not exist, so it was created`)
    }

    // this is useful for troubleshooting the CSP and/or make it easier to
    // consume by other tools (e.g. send a Telegram message containing the
    // current CSP directives)
    await writeFileAsync(
      path.join(outdir, 'eleventy-plugin-csp-config.json'),
      JSON.stringify(pluginConfig, null, 2)
    )

    // await writeFileAsync(
    //   path.join(outdir, 'eleventy-plugin-csp.json'),
    //   JSON.stringify(cspObj, null, 2)
    // )

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
