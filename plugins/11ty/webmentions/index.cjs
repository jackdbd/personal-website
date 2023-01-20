const makeDebug = require('debug')
const { z } = require('zod')
const { makeClient } = require('./webmention-io.cjs')

const PREFIX = '[💬 11ty-plugin-webmentions]'

const debug = makeDebug('eleventy-plugin-webmentions:index')

const defaults = {
  cacheDirectory: '.cache-webmentions',
  cacheDuration: '3600s',
  cacheVerbose: false,
  domain: undefined,
  // https://github.com/apostrophecms/sanitize-html#default-options
  sanitizeOptions: {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
    allowedAttributes: {
      a: ['href']
    }
  },
  token: undefined
}

const sanitize_options_schema = z.object({
  allowedTags: z.array(z.string().min(1)),
  allowedAttributes: z.any()
  // allowedAttributes: z.object({
  //   a: z.array(z.string().min(1))
  // })
})

const schema = z.object({
  cacheDirectory: z.string().min(1).default(defaults.cacheDirectory),
  cacheDuration: z.string().default(defaults.cacheDuration),
  cacheVerbose: z.boolean().optional().default(defaults.cacheVerbose),
  domain: z.string().min(1),
  sanitizeOptions: sanitize_options_schema.default(defaults.sanitizeOptions),
  token: z.string().min(1)
})

// type Config = z.infer<typeof schema>

// give the plugin configuration function a name, so it can be easily spotted in
// EleventyErrorHandler
const webmentions = (eleventyConfig, providedOptions) => {
  const result = schema.safeParse(providedOptions)

  if (!result.success) {
    throw new Error(`${PREFIX} invalid configuration: ${result.error.message}`)
  }

  const {
    cacheDirectory,
    cacheDuration,
    cacheVerbose,
    domain,
    sanitizeOptions,
    token
  } = result.data

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
