/**
 * This is the starter policy described here:
 * https://content-security-policy.com/
 */
const starter_policy = {
  'base-uri': ['self'],
  'connect-src': ['self'],
  'default-src': ['none'],
  'form-action': ['self'],
  'img-src': ['self'],
  'script-src': ['self'],
  'style-src': ['self']
}

/**
 * Recommended policy for most sites.
 *
 * Differences with the standard policy are the following ones:
 * - font-src is set to 'self', to allow self-hosted fonts
 * - frame-ancestors is set to 'none'
 * - manifest-src is set to 'self', to allow a self-hosted web application
 *   manifest,so the website can be installed as Progressive Web App.
 *   Learn more: https://developer.mozilla.org/en-US/docs/Web/Manifest
 * - object-src is set to 'none' as recommended here: https://csp.withgoogle.com/docs/strict-csp.html
 * - prefetch-src is set to 'self, to allow prefetching content hosted on this origin
 * - upgrade-insecure-requests is set to true, even if I am not sure it's
 *   really necessary, since it does NOT replace HSTS.
 *   Learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/upgrade-insecure-requests
 */
const recommended_policy = {
  ...starter_policy,
  'font-src': ['self'],
  'frame-ancestors': ['none'],
  'manifest-src': ['self'],
  'object-src': ['none'],
  'prefetch-src': ['self'],
  'upgrade-insecure-requests': true
}

module.exports = { starter_policy, recommended_policy }
