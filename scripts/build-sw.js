const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const { generateSW } = require('workbox-build');

// Factory that returns a function to generate an additional ManifestEntry for
// the Workbox configuration.
// https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.ManifestEntry
const makeManifestEntry = (outputDir, string) => {
  return async (filepath) => {
    const sha256Hasher = crypto.createHash('sha256');
    try {
      const html = await readFileAsync(filepath, 'utf8');
      const url = path.relative(outputDir, filepath);
      sha256Hasher.update(`${html}-${string}`, 'utf-8');
      return {
        url,
        revision: sha256Hasher.digest('base64')
      };
    } catch (err) {
      throw new Error(
        `Could not read ${filepath}. Double-check the paths in htmlPagesToPrecache\n${err.message}`
      );
    }
  };
};

const makeWorkboxConfig = (options) => {
  const {
    additionalManifestEntries = [],
    cacheId = 'test-cache-id',
    globDirectory = '_site',
    swDest = '_site/sw.js'
  } = options || {};

  return {
    additionalManifestEntries,
    cacheId,
    globDirectory,
    globPatterns: [
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
};

// 11ty outputs the generated html pages in this directory.
// const BUILD_ROOT = '_site';

// precache all the main pages
// '{projects,styleguide,success,tags}/index.html',
// precaching all blog posts is probably too much. Maybe precache only the most
// popular blog posts? Or the most recent ones?
// '**/posts/*/index.html'

// https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.generateSW
const buildSW = async (options) => {
  const {
    cacheId = 'test-cache-id',
    netlifyTomlPath = 'netlify.toml',
    outputDir = '_site'
  } = options || {};

  const swDest =
    options !== undefined && options.swDest !== undefined
      ? options.swDest
      : path.join(outputDir, 'sw.js');

  const DEFAULT_HTML_PAGES_TO_PRECACHE = [
    path.join(outputDir, '404.html'),
    path.join(outputDir, 'index.html')
  ];

  const wereHtmlPagesToPrecacheSpecified =
    options !== undefined && options.htmlPagesToPrecache !== undefined;

  const htmlPagesToPrecache = wereHtmlPagesToPrecacheSpecified
    ? options.htmlPagesToPrecache
    : DEFAULT_HTML_PAGES_TO_PRECACHE;

  let string;
  try {
    string = await readFileAsync(netlifyTomlPath);
  } catch (err) {
    throw new Error(`Could not read ${netlifyTomlPath}\n${err.message}`);
  }

  const manifestEntry = makeManifestEntry(outputDir, string);
  const promises = htmlPagesToPrecache.map(manifestEntry);

  let additionalManifestEntries;
  try {
    additionalManifestEntries = await Promise.all(promises);
  } catch (err) {
    throw new Error(
      `Could not generate additionalManifestEntries for Workbox config\n${err.message}`
    );
  }

  const workboxConfig = makeWorkboxConfig({
    additionalManifestEntries,
    cacheId,
    globDirectory: outputDir,
    swDest
  });

  try {
    const result = await generateSW(workboxConfig);
    const { count, filePaths, size, warnings } = result;
    const kB = `(${new Intl.NumberFormat('en-US').format(size / 1024)} kB)`;
    console.log(
      `Generated ${swDest}, which will precache ${count} files in cache ${cacheId}, totaling ${size} bytes. ${kB}`
    );
    console.log(`Generated ${filePaths.length} files`, filePaths);
    console.warn('warnings', warnings);
  } catch (err) {
    throw new Error(`Could not generate ${swDest}\n${err.message}`);
  }
};

// TODO: write tests for this
// const CONFIG = {
//   htmlPagesToPrecache: [
//     path.join('_site', 'about', 'index.html'),
//     path.join('_site', 'blog', 'index.html')
//   ]
// };

// const CONFIG = {
//   cacheId: 'giacomodebidda.com',
// };

// const CONFIG = {};
// const CONFIG = undefined;

// buildSW(CONFIG).then(console.log).catch(console.error);

module.exports = { buildSW };
