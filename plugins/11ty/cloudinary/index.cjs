const makeDebug = require('debug')
const { z } = require('zod')
const {
  DEBUG_PREFIX,
  DEFAULT,
  ERROR_MESSAGE_PREFIX
} = require('./constants.cjs')
const { makeClient } = require('./client.cjs')
const { cloudinaryImage, cloudinaryVideo } = require('./shortcodes.cjs')
const { makeTransformCloudinaryURLs } = require('./transforms.cjs')

const debug = makeDebug(`${DEBUG_PREFIX}:index`)

const schema = z.object({
  apiKey: z.string().min(1),
  apiSecret: z.string().min(1),
  cacheDirectory: z.string().min(1).default(DEFAULT.cacheDirectory),
  cacheDuration: z.string().default(DEFAULT.cacheDuration),
  cacheVerbose: z.boolean().optional().default(DEFAULT.cacheVerbose),
  cloudName: z.string().min(1)
})

/**
 * Configuration function for the Cloudinary plugin.
 * We give the plugin configuration function a name, so it can be easily spotted
 * in EleventyErrorHandler.
 */
const cloudinary = (eleventyConfig, providedOptions) => {
  const result = schema.safeParse(providedOptions)

  if (!result.success) {
    throw new Error(`${ERROR_MESSAGE_PREFIX}${result.error.message}`)
  }

  const {
    apiKey,
    apiSecret,
    cacheDirectory,
    cacheDuration,
    cacheVerbose,
    cloudName
  } = result.data

  const { fetchCloudinaryResponse } = makeClient({
    api_key: apiKey,
    api_secret: apiSecret,
    cache_directory: cacheDirectory,
    cache_duration: cacheDuration,
    cache_verbose: cacheVerbose,
    cloud_name: cloudName
  })

  eleventyConfig.addShortcode('cloudinaryImage', cloudinaryImage)
  debug(`added shortcode 'cloudinaryImage'`)

  eleventyConfig.addShortcode('cloudinaryVideo', cloudinaryVideo)
  debug(`added shortcode 'cloudinaryVideo'`)

  eleventyConfig.addTransform(
    'transformCloudinaryURLs',
    makeTransformCloudinaryURLs({
      class_string: DEFAULT.classString,
      cloud_name: cloudName,
      fetchCloudinaryResponse,
      should_lazy_load: DEFAULT.shouldLazyLoad,
      should_throw_if_no_alt: DEFAULT.shouldThrowIfNoAlt,
      should_throw_if_no_caption: DEFAULT.shouldThrowIfNoCaption
    })
  )
  debug(`added transform 'transformCloudinaryURLs'`)

  // https://www.11ty.dev/docs/copy/#how-input-directories-are-handled
  eleventyConfig.addPassthroughCopy({
    'src/includes/assets/vtt': 'assets/vtt'
  })
  debug(`added passthrough copy src/includes/assets/vtt => assets/vtt`)
}

module.exports = { initArguments: {}, configFunction: cloudinary }
