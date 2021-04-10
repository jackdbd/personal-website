module.exports = {
  // The variables set here will be accessible both to templates, and to
  // 11ty transforms, shortcodes, filters, and collections.
  domain: process.env.DOMAIN,
  environment: process.env.ELEVENTY_ENV,
  sha_inline_css: 'INLINE_CSS',
  sha_inline_js: 'INLINE_JS',
  sha_sw_registration_js: 'SW_REGISTRATION_JS'
};
