const makeDebug = require('debug')
const { z } = require('zod')
const { makeClient } = require('./webmention-io.cjs')
const { sanitizeWebmentionAuthor } = require('./utils.cjs')

const PREFIX = '[💬 11ty-plugin-webmentions]'

const debug = makeDebug('eleventy-plugin-webmentions:index')

const defaults = {
  blacklisted: [],
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

const blacklisted_item_schema = z.object({
  id: z.number().min(1).describe('wm-id of the webmention to blacklist'),
  reason: z
    .string()
    .min(1)
    .describe('reason why this webmention is blacklisted')
})

const sanitize_options_schema = z.object({
  allowedTags: z.array(z.string().min(1)),
  allowedAttributes: z.any()
  // allowedAttributes: z.object({
  //   a: z.array(z.string().min(1))
  // })
})

const schema = z.object({
  blacklisted: z.array(blacklisted_item_schema).default(defaults.blacklisted),
  cacheDirectory: z.string().min(1).default(defaults.cacheDirectory),
  cacheDuration: z.string().default(defaults.cacheDuration),
  cacheVerbose: z.boolean().optional().default(defaults.cacheVerbose),
  domain: z.string().min(1).regex(new RegExp('^((?!http?).)(www.)?.*$'), {
    message:
      'Invalid domain. This string should be a domain, without https:// (e.g. example.com, www.example.com)'
  }),
  sanitizeOptions: sanitize_options_schema.default(defaults.sanitizeOptions),
  token: z
    .string({ required_error: 'You must provide your Webmention.io token' })
    .min(1)
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
    blacklisted,
    cacheDirectory,
    cacheDuration,
    cacheVerbose,
    domain,
    sanitizeOptions,
    token
  } = result.data

  debug(`cache responses from Webmention.io %O`, {
    cacheDirectory,
    cacheDuration
  })

  const webmentionsIo = makeClient({
    blacklisted,
    cacheDirectory,
    cacheDuration,
    cacheVerbose,
    sanitizeOptions,
    token
  })

  eleventyConfig.addGlobalData('webmentionsSentToDomain', async () => {
    const webmentions = await webmentionsIo.webmentionsSentToDomain(domain)
    debug(
      `added global data 'webmentionsSentToDomain' to eleventy data cascade`
    )
    return webmentions
  })

  eleventyConfig.addFilter('sanitizeWebmentionAuthor', sanitizeWebmentionAuthor)

  eleventyConfig.addAsyncFilter(
    'webmentionsSentToRelativePath',
    async (relative_path) => {
      const url = new URL(relative_path, `https://${domain}`)
      return await webmentionsIo.webmentionsSentToUrl(url.href)
    }
  )
}

module.exports = { initArguments: {}, configFunction: webmentions }
