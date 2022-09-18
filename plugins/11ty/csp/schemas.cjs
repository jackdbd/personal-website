const Joi = require('joi')

// 2 is because top level domains have at least 2 characters
const csp_host_source_with_no_protocol = Joi.string().pattern(
  /^((?!https?).)+(.*\..{2,})$/,
  {
    name: 'host-with-no-protocol'
  }
)

const csp_host_source_with_protocol = Joi.string().pattern(/^https?:\/\/.*$/, {
  name: 'host-with-protocol'
})

const csp_hash_source_to_compute = Joi.valid('sha256', 'sha384', 'sha512')

const csp_hash_source = Joi.string().pattern(/^sha-(256|384|512).*$/, {
  name: '<hash-algorithm>-<base64-value>'
})

const csp_nonce_source = Joi.string().pattern(/^nonce-.*$/, {
  name: 'nonce-<base64-value>'
})

const csp_scheme_source = Joi.valid(
  'http:',
  'https:',
  // data schemes are possible, but not recommended
  'blob:',
  'data:',
  'filesystem:',
  'mediastream:'
)

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources#sources
// const csp_source_value = Joi.string().min(1)
const csp_source_value = Joi.alternatives().try(
  csp_host_source_with_no_protocol,
  csp_host_source_with_protocol,
  csp_scheme_source,
  csp_hash_source_to_compute,
  csp_hash_source,
  csp_nonce_source,
  Joi.valid(
    'none',
    'report-sample',
    'self',
    'strict-dynamic',
    'unsafe-eval',
    'unsafe-hashes',
    'unsafe-inline'
  )
)

// https://joi.dev/api/?v=17.6.0#arrayuniquecomparator-options
const hashAlgorithmComparator = (a, b) => {
  if (a === 'sha256' && (b === 'sha384' || b === 'sha512')) {
    return true
  }
  if (a === 'sha384' && (b === 'sha256' || b === 'sha512')) {
    return true
  }
  if (a === 'sha512' && (b === 'sha256' || b === 'sha384')) {
    return true
  }
  return false
}

const csp_source_values = Joi.array()
  .items(csp_source_value)
  .min(1)
  .unique()
  .unique(hashAlgorithmComparator)

const glob_pattern = Joi.string().min(1)

const glob_patterns = Joi.array().items(glob_pattern).min(1)

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-to
const groupname = Joi.string().min(1)

const groupnames = Joi.array().items(groupname).min(1)

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/require-trusted-types-for
const require_trusted_types_for_value = Joi.string().valid('script')

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/sandbox
const sandbox_value = Joi.string().valid(
  'allow-downloads',
  'allow-downloads-without-user-activation',
  'allow-forms',
  'allow-modals',
  'allow-orientation-lock',
  'allow-pointer-lock',
  'allow-popups',
  'allow-popups-to-escape-sandbox',
  'allow-presentation',
  'allow-same-origin',
  'allow-scripts',
  'allow-storage-access-by-user-activation',
  'allow-top-navigation',
  'allow-top-navigation-by-user-activation',
  'allow-top-navigation-to-custom-protocol'
)

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/trusted-types
const trusted_types_value = Joi.string().min(1)

const defaultOptions = {
  allowDeprecatedDirectives: false,
  directives: {},
  globPatterns: ['/', '/*/'],
  globPatternsDetach: [],
  excludePatterns: [],
  includePatterns: ['/**/**.html'],
  reportOnly: false
}

const directives = Joi.object({
  'base-uri': csp_source_values,
  'child-src': csp_source_values,
  'connect-src': csp_source_values,
  'default-src': csp_source_values,
  'font-src': csp_source_values,
  'form-action': csp_source_values,
  'frame-ancestors': csp_source_values,
  'frame-src': csp_source_values,
  'img-src': csp_source_values,
  'manifest-src': csp_source_values,
  'media-src': csp_source_values,
  'navigate-to': csp_source_values,
  'object-src': csp_source_values,
  'prefetch-src': csp_source_values,
  'report-to': groupnames,
  'require-trusted-types-for': Joi.array()
    .items(require_trusted_types_for_value)
    .min(1),
  sandbox: Joi.array().items(sandbox_value).min(1),
  'script-src': csp_source_values,
  'script-src-attr': csp_source_values,
  'script-src-elem': csp_source_values,
  'source-values': csp_source_values,
  'style-src': csp_source_values,
  'style-src-attr': csp_source_values,
  'style-src-elem': csp_source_values,
  'trusted-types': Joi.array().items(trusted_types_value).min(1),
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/upgrade-insecure-requests
  'upgrade-insecure-requests': Joi.boolean(),
  'worker-src': csp_source_values
})

const pluginOptions = Joi.object().keys({
  allowDeprecatedDirectives: Joi.boolean().default(
    defaultOptions.allowDeprecatedDirectives
  ),

  directives: directives.default(defaultOptions.directives),

  excludePatterns: glob_patterns.default(defaultOptions.excludePatterns),

  globPatterns: glob_patterns.default(defaultOptions.globPatterns),

  // https://developers.cloudflare.com/pages/platform/headers/#detach-a-header
  globPatternsDetach: glob_patterns.default(defaultOptions.globPatternsDetach),

  includePatterns: glob_patterns.default(defaultOptions.includePatterns),

  reportOnly: Joi.boolean().default(defaultOptions.reportOnly)
})

module.exports = { defaultOptions, pluginOptions }
