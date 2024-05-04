export const DEBUG_PREFIX = '11ty-plugin:webmentions'

export const ERROR_PREFIX = '[💬 11ty-plugin-webmentions]'

export const DEFAULT_BLACKLISTED = []

export const DEFAULT_CACHE_DIRECTORY = '.cache-webmentions'
export const DEFAULT_CACHE_DURATION = '3600s'
export const DEFAULT_CACHE_VERBOSE = false

export const DEFAULT_DOMAIN = undefined

// https://github.com/apostrophecms/sanitize-html#default-options
export const DEFAULT_SANITIZE_OPTIONS = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p'],
  allowedAttributes: {
    a: ['href']
  }
}

export const DEFULT_TOKEN = undefined

export const DEFAULT_PLUGIN_CONFIG = {
  blacklisted: DEFAULT_BLACKLISTED,
  cacheDirectory: DEFAULT_CACHE_DIRECTORY,
  cacheDuration: DEFAULT_CACHE_DURATION,
  cacheVerbose: DEFAULT_CACHE_VERBOSE,
  domain: DEFAULT_DOMAIN,
  sanitizeOptions: DEFAULT_SANITIZE_OPTIONS,
  token: DEFULT_TOKEN
}
