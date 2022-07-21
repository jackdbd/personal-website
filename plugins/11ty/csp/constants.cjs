const deprecatedDirectives = {
  'block-all-mixed-content': {
    hrefs: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/block-all-mixed-content'
    ],
    whatToDoInstead: 'use the upgrade-insecure-requests directive'
  },
  'plugin-types': {
    hrefs: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/plugin-types'
    ],
    whatToDoInstead: 'use the object-src directive to disallow all plugins'
  },
  referrer: {
    hrefs: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/referrer'
    ],
    whatToDoInstead: 'use the Referrer-Policy header'
  },
  'report-uri': {
    hrefs: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri'
    ],
    whatToDoInstead: 'use the report-to directive'
  },
  'require-sri-for': {
    hrefs: [
      'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/require-sri-for'
    ],
    whatToDoInstead: 'TODO: just drop it?'
  }
}

const deprecatedDirectivesSet = new Set(Object.keys(deprecatedDirectives))

const supportedDirectivesSet = new Set([
  'base-uri',
  'child-src',
  'connect-src',
  'default-src',
  'font-src',
  'form-action',
  'frame-ancestors',
  'frame-src',
  'img-src',
  'manifest-src',
  'media-src',
  'navigate-to',
  'object-src',
  'prefetch-src',
  'report-to',
  'require-trusted-types-for',
  'sandbox',
  'script-src',
  'script-src-attr',
  'script-src-elem',
  'source-values',
  'style-src',
  'style-src-attr',
  'style-src-elem',
  'trusted-types',
  'upgrade-insecure-requests',
  'worker-src'
])

module.exports = {
  deprecatedDirectives,
  deprecatedDirectivesSet,
  supportedDirectivesSet
}
