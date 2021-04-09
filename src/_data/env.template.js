module.exports = {
  // The variables set here will be accessible both to templates, and to
  // 11ty transforms, shortcodes, filters, and collections.
  domain: process.env.DOMAIN,
  environment: process.env.ELEVENTY_ENV,
  nonce_inline_css: 'INLINE_CSS',
  nonce_inline_js: 'INLINE_JS',
  nonce_sw: 'SW_REGISTRATION'
};
