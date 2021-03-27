// https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.generateSW
module.exports = {
  cacheId: 'giacomodebidda.com',
  cleanupOutdatedCaches: true,
  globDirectory: '_site/',
  globPatterns: [
    '**/*.{css,html,gif,ico,jpg,js,json,png,svg,txt,xml,webmanifest,webp,woff,woff2}'
  ],
  ignoreURLParametersMatching: [
    new RegExp(/^utm_/, 'i'),
    new RegExp(/^fbclid$/, 'i')
  ],
  runtimeCaching: [
    {
      handler: 'StaleWhileRevalidate',
      urlPattern: /^https?:\/\/fonts\.googleapis\.com/
    },
    {
      handler: 'StaleWhileRevalidate',
      urlPattern: /^https?:\/\/fonts\.gstatic\.com/
    }
  ],
  // skipWaiting: true,
  sourcemap: true,
  swDest: '_site/sw.js'
};
