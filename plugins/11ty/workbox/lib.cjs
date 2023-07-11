const crypto = require('node:crypto')
const { readFile } = require('node:fs/promises')
const path = require('node:path')
const chalk = require('chalk')
const Joi = require('joi')
const { generateSW, getManifest } = require('workbox-build')
// const demoPlugin = require('../../workbox/demo/index.cjs')

// Factory that returns a function to generate an additional ManifestEntry for
// the Workbox configuration.
// https://developer.chrome.com/docs/workbox/reference/workbox-build/#type-ManifestEntry

// an alternative would be to use templatedURLs
// https://github.com/GoogleChrome/workbox/issues/2299#issuecomment-826918658

const makeFilepathToWorkboxManifestEntry = ({
  eleventyOutputDirectory,
  string
}) => {
  //
  return async function filepathToWorkboxManifestEntry(filepath) {
    const sha256Hasher = crypto.createHash('sha256')
    try {
      const html = await readFile(filepath, { encoding: 'utf8' })
      const url = path.relative(eleventyOutputDirectory, filepath)
      sha256Hasher.update(`${html}-${string}`, 'utf-8')
      return {
        url,
        revision: sha256Hasher.digest('base64')
      }
    } catch (err) {
      throw new Error(
        `Could not read ${filepath}. Double-check the paths in htmlPagesToPrecache\n${err.message}`
      )
    }
  }
}

const PREFIX = '[⚙️ 11ty-workbox-plugin] '

const configSchema = Joi.object().keys({
  cachePrefix: Joi.string().min(1).required(),

  eleventyOutputDirectory: Joi.string().min(1).required(),

  verbose: Joi.boolean().required()
})

const buildServiceWorker = async (config) => {
  Joi.assert(config, configSchema)

  const cfOk = chalk.green
  const cfError = chalk.red
  const cfWarn = chalk.yellow
  const cfInfo = chalk.blue
  // const cfOk = (x) => x
  // const cfError = (x) => x
  // const cfWarn = (x) => x
  // const cfInfo = (x) => x

  const { cachePrefix, eleventyOutputDirectory, verbose } = config

  const runtimeCaching = []

  // I think that images uploaded to an image CDN like Cloudinary are unlikely
  // to change, so it's appropriate to use a CacheFirst strategy and let the
  // service worker cache them for 1 year.
  // Keeping up to 30 images in this runtime cache should be more than enough.
  // https://developer.chrome.com/docs/workbox/reference/workbox-core/#type-RouteHandler
  const urlPattern = /.*\.(?:avif|gif|jpg|jpeg|png|svg|webp)/
  // const urlPattern =
  //   /res\.cloudinary\.com\/.*\.(?:avif|gif|jpg|jpeg|png|svg|webp)/

  runtimeCaching.push({
    handler: 'CacheFirst',
    urlPattern,
    options: {
      cacheName: `${cachePrefix}-runtimecache-images`,
      expiration: {
        maxAgeSeconds: 60 * 60 * 24 * 365,
        maxEntries: 30
      }
    }
  })

  // runtimeCaching.push({
  //   handler: 'CacheFirst',
  //   urlPattern: /.*\.(?:avif|gif|jpg|jpeg|png|svg|webp)/,
  //   options: {
  //     cacheName: `${cachePrefix}-runtimecache-images`,
  //     expiration: {
  //       maxAgeSeconds: 60 * 60 * 24 * 365,
  //       maxEntries: 30
  //     }
  //   }
  // })

  console.log(
    cfInfo(
      `${PREFIX}the generated service worker will use ${runtimeCaching.length} runtime caches`
    ),
    runtimeCaching
  )

  let string = ''

  const filepathToWorkboxManifestEntry = makeFilepathToWorkboxManifestEntry({
    eleventyOutputDirectory,
    string
  })

  const htmlPagesToPrecache = [
    path.join(eleventyOutputDirectory, '404.html'),
    path.join(eleventyOutputDirectory, 'about', 'index.html'),
    path.join(eleventyOutputDirectory, 'blog', 'index.html'),
    path.join(eleventyOutputDirectory, 'projects', 'index.html'),
    path.join(eleventyOutputDirectory, 'tags', 'index.html')
  ]

  const promises = htmlPagesToPrecache.map(filepathToWorkboxManifestEntry)

  let additionalManifestEntries = []
  try {
    additionalManifestEntries = await Promise.all(promises)
  } catch (err) {
    throw new Error(
      `Could not generate additionalManifestEntries for Workbox config\n${err.message}`
    )
  }

  const globDirectory = eleventyOutputDirectory

  const swFileName = 'sw.js'

  const globIgnores = [
    '**/node_modules/**/*',
    // definitely do NOT cache the service worker itself
    `**/${swFileName}`
  ]

  const globPatterns = [
    // precache CSS hosted on this origin.
    // CSS files are tipically quite small, so the browser can precache them
    // pretty quickly when installing the service worker.
    '**/*.css',

    // precache fonts hosted on this origin.
    // Tip: read here to understand why self-hosting fonts.
    // https://csswizardry.com/2020/05/the-fastest-google-fonts/
    '**/*.{woff,woff2}',

    // precache SOME images hosted on this origin.
    // Precaching too many images is overkill, it could use too much network
    // bandwidth and slow down the service worker installation too much.
    '**/*.{ico,svg}',
    // TODO: precache images used as fallbacks and LQIP (Low Quality Image Placeholders)
    // '**/*.{avif,gif,ico,jpg,jpeg,png,svg,webp}',

    // precache JS hosted on this origin.
    // I think it's a good idea (performance-wise) to precache only ESSENTIAL scripts.
    '**/*.js',

    // precache SOME html pages, but not too many
    // '404.html',
    // '{about,blog,projects,styleguide,tags}/index.html',

    // I still don't know whether precaching the RSS feed (the one for my
    // website is ~1MB) and the sitemap (the one for my website is ~16KB)
    // is a good idea or not. Probably not...

    // I think precaching the manifest.webmanifest is required to make the
    // website usable offline.
    'manifest.webmanifest'
  ]

  // when this is set to true, an error reading a directory when generating
  // the precache manifest will cause the build to fail.
  const globStrict = true

  const swDest = path.join(eleventyOutputDirectory, swFileName)

  try {
    // https://developer.chrome.com/docs/workbox/reference/workbox-build/#method-generateSW
    // https://developer.chrome.com/docs/workbox/reference/workbox-build/#type-GenerateSWOptions
    const result = await generateSW({
      additionalManifestEntries,

      cacheId: cachePrefix,

      // I wonder why this is not set to true by default
      cleanupOutdatedCaches: true,

      // https://web.dev/service-worker-lifecycle/#clientsclaim
      clientsClaim: false,

      // dontCacheBustURLsMatching: [new RegExp('...')],
      globDirectory,
      globIgnores,
      globPatterns,
      globStrict,

      ignoreURLParametersMatching: [
        new RegExp(/^utm_/, 'i'),
        new RegExp(/^fbclid$/, 'i')
      ],

      // avoid precaching files larger than 500kB
      maximumFileSizeToCacheInBytes: 500000,

      // reference for caching strategies:
      // https://developer.chrome.com/docs/workbox/modules/workbox-strategies/
      // https://web.dev/offline-cookbook/
      runtimeCaching,

      // as far as I understand, skip the `waiting` state can be dangerous.
      // https://stackoverflow.com/questions/49482680/workbox-the-danger-of-self-skipwaiting
      skipWaiting: false,

      // always ship the source map, in production too. Here is why.
      // https://m.signalvnoise.com/paying-tribute-to-the-web-with-view-source/
      sourcemap: true,

      swDest
    })

    console.log(
      cfOk(
        `${PREFIX}${swDest} generated. ${result.count} assets/pages will be precached`
      ),
      result
    )
    if (verbose) {
      console.log(cfInfo(`${PREFIX}generateSW result:`), result)
    }
  } catch (err) {
    console.log(
      cfError(`${PREFIX}could not generate service worker: ${err.message}`)
    )
  }

  if (verbose) {
    try {
      // https://developer.chrome.com/docs/workbox/reference/workbox-build/#type-GetManifestOptions
      const manifest = await getManifest({
        additionalManifestEntries,
        // dontCacheBustURLsMatching,
        globDirectory,
        globIgnores,
        globPatterns,
        globStrict
      })
      console.log(
        cfOk(`${PREFIX}retrieved service worker's precache manifest`),
        manifest
      )
    } catch (err) {
      console.log(
        cfError(
          `${PREFIX}could not retrieve service worker's precache manifest: ${err.message}`
        )
      )
    }
  }
}

module.exports = { PREFIX, buildServiceWorker }
