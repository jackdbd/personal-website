const fs = require('fs');
const path = require('path');
const util = require('util');
// const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);
const { generateSW } = require('workbox-build');
const { hashFromString } = require('./hash');

const cacheId = 'giacomodebidda.com';
const swDest = '_site/sw.js';

// 11ty outputs the generated html pages in this directory.
const BUILD_ROOT = '_site';

// https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.generateSW
const buildSW = async (csp) => {
  // console.log('🚀 === buildSW === csp', csp);
  const filepath = path.join(BUILD_ROOT, 'index.html');
  const html = await readFileAsync(filepath, 'utf8');
  const indexHtmlRevision = hashFromString(`${html}-${csp}`);
  console.log(`revision for ${filepath}: ${indexHtmlRevision}`);

  const workboxConfig = {
    additionalManifestEntries: [
      {
        url: 'index.html',
        revision: indexHtmlRevision
      }
    ],
    cacheId,
    globDirectory: '_site/',
    globPatterns: [
      // precache all the main pages
      '404.html',
      // 'index.html',
      '{about,blog,contact,projects,styleguide,success,tags}/index.html',
      // precaching all blog posts is probably too much. Maybe precache only the most popular blog posts? Or the most recent ones?
      // '**/posts/*/index.html'
      // precache self-hosted static assets (I host most of my images on
      // Cloudinary, so there aren't many images hosted on this origin).
      'assets/css/*.css',
      'assets/fonts/*.{woff,woff2}',
      'assets/img/**/*.{avif,gif,ico,jpg,png,svg,webp}',
      'assets/js/*.js',
      // I still don't know whether precaching the RSS feed (it's ~1MB) and the
      // sitemap (it's ~16KB) is a good idea or not. Probably not...
      'manifest.webmanifest'
    ],
    globStrict: true,
    ignoreURLParametersMatching: [
      new RegExp(/^utm_/, 'i'),
      new RegExp(/^fbclid$/, 'i')
    ],
    // avoid precaching files larger than 50kB
    maximumFileSizeToCacheInBytes: 50 * 1024,
    // Reference for caching strategies:
    // https://developers.google.com/web/tools/workbox/modules/workbox-strategies
    // https://web.dev/offline-cookbook/
    runtimeCaching: [
      // The images I host on my Cloudinary account are unlikely to ever change,
      // so it's appropriate to use a CacheFirst strategy and let the service
      // worker cache them for 1 year. Keeping up to 30 images in this cache
      // should be more than enough.
      {
        handler: 'CacheFirst',
        urlPattern: /^https:\/\/res\.cloudinary\.com/,
        options: {
          cacheName: `${cacheId}-cloudinary`,
          expiration: {
            maxAgeSeconds: 60 * 60 * 24 * 365,
            maxEntries: 30
          }
        }
      }
      // I am experimenting with this. If the CSS/JS assets had a hash in their
      // name it would be ok to use a CacheFirst strategy with a 1 year expiration.
      // The problem is that this site is hosted on Netlify, which has a peculiar
      // caching policy that I still don't fully understand.
      // https://www.netlify.com/blog/2017/02/23/better-living-through-caching/
      // {
      //   handler: 'StaleWhileRevalidate',
      //   urlPattern: /^https:\/\/epic-benz-a3f006\.netlify\.app\/assets\/(css|js)\/.*/,
      //   options: {
      //     cacheName: `${cacheId}-static-assets`,
      //     expiration: {
      //       maxAgeSeconds: 60 * 60 * 24 * 7
      //     }
      //   }
      // }
      // The few images I self-host on this origin are stored in the precache
      // during the service worker installation because they are added to the
      // Workbox precache manifest. They are also unlikely to change, so for them
      // I think we can avoid any network request whatsoever.
      // TODO: update urlPattern when the website is deployed on the real domain.
      // {
      //   handler: 'CacheOnly',
      //   urlPattern: /^https:\/\/epic-benz-a3f006\.netlify\.app\/assets\/img\/.*/
      // }
    ],

    // As far as I understand, skip the `waiting` state can be dangerous.
    // https://stackoverflow.com/questions/49482680/workbox-the-danger-of-self-skipwaiting
    skipWaiting: false,

    // always ship the source map, in production too. Here is why.
    // https://m.signalvnoise.com/paying-tribute-to-the-web-with-view-source/
    sourcemap: true,
    swDest
  };

  try {
    const value = await generateSW(workboxConfig);
    const { count, filePaths, size, warnings } = value;
    const kB = `(${new Intl.NumberFormat('en-US').format(size / 1024)} kB)`;
    console.log(
      `Generated ${swDest}, which will precache ${count} files, totaling ${size} bytes. ${kB}`
    );
    console.log(`Generated ${filePaths.length} files`, filePaths);
    console.warn('warnings', warnings);
  } catch (err) {
    console.error(err);
  }
};

module.exports = { buildSW };
