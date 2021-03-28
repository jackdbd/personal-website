// https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.generateSW
module.exports = {
  cacheId: 'giacomodebidda.com',
  cleanupOutdatedCaches: true,
  globDirectory: '_site/',
  globPatterns: [
    // precache all the main pages
    '{404,index,success}.html',
    '{blog,contact,projects,tags}/index.html',
    // precaching all blog posts is probably too much. Maybe precache only the most popular blog posts? Or the most recent ones?
    // '**/posts/*/index.html'
    // precache local JS files
    '**/*.js',
    // precache local CSS files
    'assets/css/*.css',
    // precache local fonts
    'assets/fonts/*.{woff,woff2}',
    // precache local images (but I host most of my images on Cloudinary, so there aren't many images hosted on this origin)
    '**/*.{avif,gif,ico,jpg,png,svg,webp}',
    // I still don't know whether precaching the RSS feed (it's ~1MB) and the sitemap (it's ~16KB) is a good idea or not.
    '{feed,sitemap}.xml'
    // should I precache JSON? txt files (e.g. robots.txt)? webmanifest?
    // '**/*.{json,txt,webmanifest}'
  ],
  ignoreURLParametersMatching: [
    new RegExp(/^utm_/, 'i'),
    new RegExp(/^fbclid$/, 'i')
  ],
  runtimeCaching: [
    // Google fonts
    {
      handler: 'StaleWhileRevalidate',
      urlPattern: /^https?:\/\/fonts\.googleapis\.com/
    },
    // Google fonts (again)
    {
      handler: 'StaleWhileRevalidate',
      urlPattern: /^https?:\/\/fonts\.gstatic\.com/
    },
    // images and media hosted on Cloudinary
    {
      handler: 'StaleWhileRevalidate',
      urlPattern: /^https?:\/\/res\.cloudinary\.com/
    }
  ],
  // skipWaiting: true,
  sourcemap: true,
  swDest: '_site/sw.js'
};
