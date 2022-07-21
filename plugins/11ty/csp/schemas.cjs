const Joi = require('joi')

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources#sources
const csp_source_value = Joi.string().min(1)

const csp_source_values = Joi.array().items(csp_source_value).min(1)

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
  //
  // This is similar to the starter policy described here:
  // https://content-security-policy.com/
  //
  // The differences are the following ones:
  // - font-src is set to 'self', to allow self-hosted fonts
  // - frame-ancestors is set to 'none'
  // - manifest-src is set to 'self', to allow a self-hosted web application
  //   manifest,so the website can be installed as Progressive Web App.
  //   Learn more: https://developer.mozilla.org/en-US/docs/Web/Manifest
  // - object-src is set to 'none' as recommended here: https://csp.withgoogle.com/docs/strict-csp.html
  // - prefetch-src is set to 'self, to allow prefetching content hosted on this origin
  // - upgrade-insecure-requests is set to true, even if I am not sure it's
  //   really necessary, since it does NOT replace HSTS.
  //   Learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/upgrade-insecure-requests
  directives: {
    'base-uri': ['self'],
    'connect-src': ['self'],
    'default-src': ['none'],
    'font-src': ['self'],
    'form-action': ['self'],
    'frame-ancestors': ['none'],
    'img-src': ['self'],
    'manifest-src': ['self'],
    'object-src': ['none'],
    'prefetch-src': ['self'],
    'script-src': ['self'],
    'style-src': ['self'],
    'upgrade-insecure-requests': true
  },
  globPatterns: ['/', '/*/'],
  globPatternsDetach: [],
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
  'upgrade-insecure-request': Joi.boolean(),
  'worker-src': csp_source_values
})

const pluginOptions = Joi.object().keys({
  allowDeprecatedDirectives: Joi.boolean().default(
    defaultOptions.allowDeprecatedDirectives
  ),

  directives: directives.default(defaultOptions.directives),

  globPatterns: glob_patterns.default(defaultOptions.globPatterns),

  // https://developers.cloudflare.com/pages/platform/headers/#detach-a-header
  globPatternsDetach: glob_patterns.default(defaultOptions.globPatternsDetach),

  reportOnly: Joi.boolean().default(defaultOptions.reportOnly)
})

module.exports = { defaultOptions, pluginOptions }
