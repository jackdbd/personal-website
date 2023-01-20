const Joi = require('joi')
const Hoek = require('@hapi/hoek')
const makeDebug = require('debug')
const { makeClient } = require('./webmention-io.cjs')

const PREFIX = '[💬 11ty-plugin-webmentions]'

const debug = makeDebug('eleventy-plugin-webmentions:index')

const defaults = {
  cacheDirectory: '.cache-webmentions',
  cacheDuration: '3600s',
  cacheVerbose: false,
  domain: undefined,
  sanitizeOptions: {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
    allowedAttributes: {
      a: ['href']
    }
  },
  token: undefined
}

const options_schema = Joi.object().keys({
  cacheDirectory: Joi.string().min(1).default(defaults.cacheDirectory),
  cacheDuration: Joi.string().default(defaults.cacheDuration),
  cacheVerbose: Joi.boolean().default(defaults.cacheVerbose),
  domain: Joi.string().min(1).required(),
  sanitizeOptions: Joi.object().default(defaults.sanitizeOptions),
  token: Joi.string().min(1).required()
})

// give the plugin configuration function a name, so it can be easily spotted in
// EleventyErrorHandler
const webmentions = (eleventyConfig, providedOptions) => {
  const config = Hoek.applyToDefaults(defaults, providedOptions)

  const result = options_schema.validate(config)
  if (result.error) {
    const message = `${PREFIX} invalid configuration: ${result.error.message}`
    throw new Error(message)
  }

  const {
    cacheDirectory,
    cacheDuration,
    cacheVerbose,
    domain,
    sanitizeOptions,
    token
  } = result.value

  debug(`cache responses from webmention.io %O`, {
    cacheDirectory,
    cacheDuration
  })

  const webmentionsIo = makeClient({
    cacheDirectory,
    cacheDuration,
    cacheVerbose,
    sanitizeOptions,
    token
  })

  // eleventyConfig.addGlobalData('webmentionsForDomain', async () => {
  //   return await webmentionsIo.webmentionsForDomain(domain)
  // })

  eleventyConfig.addAsyncFilter('webmentionsForPage', async (page) => {
    // console.log('=== this ===', this)
    // console.log('=== page ===', page)
    const target = `https://${domain}${page.url}`
    return await webmentionsIo.webmentionsForTarget(target)
  })
}

module.exports = { initArguments: {}, configFunction: webmentions }
