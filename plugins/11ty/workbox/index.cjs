const Joi = require('joi')
const makeDebug = require('debug')
const { PREFIX, buildServiceWorker } = require('./lib.cjs')

const PREFIX = '[⚙️ 11ty-plugin-workbox]'

const debug = makeDebug('eleventy-plugin-workbox/index')

const defaultOptions = {
  verbose: false
}

const options_schema = Joi.object().keys({
  verbose: Joi.boolean().default(defaultOptions.verbose)
})

const makeEleventyEventHandler = (eleventyConfig, pluginConfig) => {
  const eleventyOutputDirectory = eleventyConfig.dir.output

  const config = { eleventyOutputDirectory, ...pluginConfig }

  // partial application, to obtain a niladic function
  return buildServiceWorker.bind(null, config)
}

// give the plugin configuration function a name, so it can be easily spotted in
// EleventyErrorHandler
const workbox = (eleventyConfig, providedOptions) => {
  const result = options_schema.validate(providedOptions)
  if (result.error) {
    const message = `${PREFIX} invalid configuration: ${result.error.message}`
    throw new Error(message)
  }
  debug('options validated')
  const pluginConfig = {}
  Object.assign(pluginConfig, defaultOptions, providedOptions)

  if (pluginConfig.verbose) {
    console.log(`${PREFIX} make event handler for eleventy.after event`)
  }

  eleventyConfig.on(
    'eleventy.after',
    makeEleventyEventHandler(eleventyConfig, pluginConfig)
  )
}

module.exports = { initArguments: {}, configFunction: workbox }
