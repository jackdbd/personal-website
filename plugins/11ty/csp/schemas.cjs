const Joi = require('joi')

// the `directives` schema is defined here:
// const cspSchemasPromise = import('@jackdbd/content-security-policy/schemas')
const directives = Joi.any()

const glob_pattern = Joi.string().min(1)

const glob_patterns = Joi.array().items(glob_pattern)

const defaultOptions = {
  allowDeprecatedDirectives: false,
  directives: {},
  globPatterns: ['/', '/*/'],
  globPatternsDetach: [],
  excludePatterns: [],
  includePatterns: ['/**/**.html'],
  reportOnly: false
}

const pluginOptions = Joi.object().keys({
  allowDeprecatedDirectives: Joi.boolean().default(
    defaultOptions.allowDeprecatedDirectives
  ),

  directives: directives.default(defaultOptions.directives),

  excludePatterns: glob_patterns.default(defaultOptions.excludePatterns),

  globPatterns: glob_patterns.min(1).default(defaultOptions.globPatterns),

  // https://developers.cloudflare.com/pages/platform/headers/#detach-a-header
  globPatternsDetach: glob_patterns.default(defaultOptions.globPatternsDetach),

  includePatterns: glob_patterns.min(1).default(defaultOptions.includePatterns),

  reportOnly: Joi.boolean().default(defaultOptions.reportOnly)
})

module.exports = { defaultOptions, pluginOptions }
