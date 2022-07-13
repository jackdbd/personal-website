const Joi = require('joi')
const makeDebug = require('debug')
const promise = import('@jackdbd/plausible-client')

const PREFIX = '[📈 11ty-plugin-plausible]'

const debug = makeDebug('eleventy-plugin-plausible/index')

const defaultOptions = {
  cacheDirectory: '.cache',
  cacheDuration: '3600s',
  cacheVerbose: false
}

const options_schema = Joi.object().keys({
  cacheDirectory: Joi.string().min(1).default(defaultOptions.cacheDirectory),
  cacheDuration: Joi.string().default(defaultOptions.cacheDuration),
  cacheVerbose: Joi.boolean().default(defaultOptions.cacheVerbose),
  apiKey: Joi.string().min(1).required(),
  siteId: Joi.string().min(1).required()
})

// give the plugin configuration function a name, so it can be easily spotted in
// EleventyErrorHandler
const plausible = (eleventyConfig, providedOptions) => {
  const result = options_schema.validate(providedOptions)
  if (result.error) {
    const message = `${PREFIX} invalid configuration: ${result.error.message}`
    throw new Error(message)
  }
  const pluginConfig = {}
  Object.assign(pluginConfig, defaultOptions, providedOptions)

  const credentials = {
    apiKey: pluginConfig.apiKey,
    siteId: pluginConfig.siteId
  }

  let verbose = defaultOptions.cacheVerbose
  if (providedOptions.cacheVerbose !== undefined) {
    verbose = providedOptions.cacheVerbose
  }

  const options = {
    directory: pluginConfig.cacheDirectory || defaultOptions.cacheDirectory,
    duration: pluginConfig.cacheDuration || defaultOptions.cacheDuration,
    verbose
  }

  eleventyConfig.on('eleventy.before', async () => {
    const { makeClient } = await promise
    const plausible = makeClient(credentials, options)
    const results = await plausible.stats.breakdown()
    const message = `retrieved ${results.length} results from the Plausible.io Stats API`
    debug(message)
    // console.log(`${PREFIX} ${message}`, results)
  })
}

module.exports = { initArguments: {}, configFunction: plausible }