import { z } from 'zod'
import {
  DEFAULT_BLACKLISTED,
  DEFAULT_CACHE_DIRECTORY,
  DEFAULT_CACHE_DURATION,
  DEFAULT_CACHE_VERBOSE,
  DEFAULT_SANITIZE_OPTIONS
} from './constants.mjs'

export const blacklisted_item = z.object({
  id: z.number().min(1).describe('wm-id of the webmention to blacklist'),
  reason: z
    .string()
    .min(1)
    .describe('reason why this webmention is blacklisted')
})

export const sanitize_options = z.object({
  allowedTags: z.array(z.string().min(1)),
  allowedAttributes: z.any()
  // allowedAttributes: z.object({
  //   a: z.array(z.string().min(1))
  // })
})

export const plugin_options = z.object({
  blacklisted: z.array(blacklisted_item).default(DEFAULT_BLACKLISTED),

  cacheDirectory: z.string().min(1).default(DEFAULT_CACHE_DIRECTORY),

  cacheDuration: z.string().default(DEFAULT_CACHE_DURATION),

  cacheVerbose: z.boolean().optional().default(DEFAULT_CACHE_VERBOSE),

  domain: z.string().min(1).regex(new RegExp('^((?!http?).)(www.)?.*$'), {
    message:
      'Invalid domain. This string should be a domain, without https:// (e.g. example.com, www.example.com)'
  }),

  sanitizeOptions: sanitize_options.default(DEFAULT_SANITIZE_OPTIONS),

  token: z
    .string({ required_error: 'You must provide your Webmention.io token' })
    .min(1)
})
