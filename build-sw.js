const { generateSW } = require('workbox-build');

const cacheId = 'giacomodebidda.com';
const swDest = '_site/sw.js';

const workboxConfig = {
  cacheId,
  cleanupOutdatedCaches: true,
  clientsClaim: true,
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
      urlPattern: /^https?:\/\/fonts\.googleapis\.com/,
      handler: 'StaleWhileRevalidate'
      // options: {
      //   cacheName: `${cacheId}-runtime-fonts`,
      //   expiration: {
      //     maxAgeSeconds: 10 // just for testing
      //   }
      // }
    },
    // Google fonts (again)
    {
      urlPattern: /^https?:\/\/fonts\.gstatic\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: `${cacheId}-runtime-fonts`,
        expiration: {
          maxAgeSeconds: 10 // just for testing
        }
      }
    },
    // images and media hosted on Cloudinary
    {
      urlPattern: /^https?:\/\/res\.cloudinary\.com/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: `${cacheId}-runtime-images`,
        expiration: {
          maxAgeSeconds: 1 * 24 * 60 * 60 // 1 Day
        }
      }
    }
  ],

  // TODO: read this and comment
  // https://stackoverflow.com/questions/49482680/workbox-the-danger-of-self-skipwaiting
  // skipWaiting: true,

  // always ship the source map, in production too. Here is why.
  // https://m.signalvnoise.com/paying-tribute-to-the-web-with-view-source/
  sourcemap: true,
  swDest
};

const buildSW = () => {
  // https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.generateSW
  generateSW(workboxConfig).then((value) => {
    const { count, filePaths, size, warnings } = value;
    console.log(
      `Generated ${swDest}, which will precache ${count} files, totaling ${size} bytes.`
    );
    console.log(`Generated ${filePaths.length} files`, filePaths);
    console.warn('warnings', warnings);
  });
};

module.exports = buildSW;
