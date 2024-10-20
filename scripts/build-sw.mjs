import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import util from 'node:util'
import crypto from 'node:crypto'
import defDebug from 'debug'
import esbuild from 'esbuild'
import { globby } from 'globby'

const __filename = fileURLToPath(import.meta.url)
const REPO_ROOT = path.join(__filename, '..', '..')
const SITE_ROOT = path.join(REPO_ROOT, '_site')
// const EMOJI = '👷'

const debug = defDebug(`script:build-sw`)
const readFileAsync = util.promisify(fs.readFile)

// A manifest entry depends on the content of the output directory and the
// content of the _headers file and the _redirects file (if the website is
// deployed to Cloudflare Pages). If any of these contents change, the revision
// of the URL to precache changes.
const defManifestEntry = (outputDir, string) => {
  return async function manifestEntry(filepath) {
    const sha256Hasher = crypto.createHash('sha256')
    try {
      const html = await readFileAsync(filepath, 'utf8')
      const url = path.relative(outputDir, filepath)
      sha256Hasher.update(`${html}-${string}`, 'utf-8')
      return {
        url,
        revision: sha256Hasher.digest('base64')
      }
    } catch (err) {
      throw new Error(`Could not read ${filepath}: ${err.message}`)
    }
  }
}

const buildServiceWorker = async ({ precachePaths }) => {
  debug(`${precachePaths.length} paths to precache`)
  const entryPoint = path.join(REPO_ROOT, 'src', 'sw.mjs')

  const headers = await readFileAsync(path.join(SITE_ROOT, '_headers'), 'utf8')

  const redirects = await readFileAsync(
    path.join(SITE_ROOT, '_redirects'),
    'utf8'
  )

  const manifestEntry = defManifestEntry(SITE_ROOT, `${headers}${redirects}`)

  const promises = precachePaths.map((filepath) => manifestEntry(filepath))
  const entries = await Promise.all(promises)
  debug(`service worker will precache ${entries.length} URLs: %O`, entries)
  //   console.log(`service worker will precache ${entries.length} URLs:`)
  //   entries.forEach((entry) => {
  //     console.log(`  ${entry.url} (rev. ${entry.revision})`)
  //   })

  const { errors, warnings } = await esbuild.build({
    bundle: true,
    define: {
      // inject these precache entries in the service worker
      'process.env.PRECACHE_ENTRIES': JSON.stringify(entries, null, 2)
    },
    entryPoints: [entryPoint],
    outdir: SITE_ROOT,
    logLevel: 'debug',
    minify: true,
    platform: 'browser',
    // https://esbuild.github.io/api/#sourcemap
    sourcemap: 'linked',
    // https://esbuild.github.io/api/#target
    // TODO: maybe I could query https://caniuse.com/ for the latest versions of
    // Chrome, Firefox, Safari, and Edge, and use those as the target.
    target: 'esnext'
  })

  debug(`service worker generated`, { errors, warnings })
}

// TODO: detaching headers is currently not supported by the updateHeaders
// function, because that function uses netlify-headers-parser, which does
// support detaching headers.
// https://developers.cloudflare.com/pages/configuration/headers/#detach-a-header

const main = async () => {
  const filepath = path.join(SITE_ROOT, '_headers')
  if (!fs.existsSync(filepath)) {
    fs.writeFileSync(filepath, '', 'utf8')
    debug(`created ${filepath}`)
  }

  // I still don't know whether precaching the RSS feed (the one for my
  // website is ~1MB) and the sitemap (the one for my website is ~16KB)
  // is a good idea or not. Probably not...

  // precache SOME html pages, but not too many

  // precache CSS hosted on this origin.
  // CSS files are tipically quite small, so the browser can precache them
  // pretty quickly when installing the service worker.

  // precache JS hosted on this origin.

  // precache fonts hosted on this origin. Maybe...

  // precache SOME images hosted on this origin.

  const patterns = [
    // `${SITE_ROOT}/assets/**/*.css`,
    // `${SITE_ROOT}/assets/**/*.js`,
    `${SITE_ROOT}/assets/**/*.{ico,svg}`,
    `${SITE_ROOT}/assets/**/*.{woff,woff2}`
  ]
  const assetPaths = await globby(patterns)

  const defaultHtmlPagesToPrecache = [
    path.join(SITE_ROOT, '404.html'),
    path.join(SITE_ROOT, 'index.html'),
    path.join(SITE_ROOT, 'about', 'index.html'),
    path.join(SITE_ROOT, 'articles', 'index.html'),
    path.join(SITE_ROOT, 'contact', 'index.html'),
    path.join(SITE_ROOT, 'notes', 'index.html'),
    path.join(SITE_ROOT, 'projects', 'index.html'),
    path.join(SITE_ROOT, 'services', 'index.html')
  ]

  const popularHtmlPages = []

  await buildServiceWorker({
    precachePaths: [
      ...assetPaths,
      // I think precaching the manifest.webmanifest is required to make the
      // website usable offline.
      path.join(SITE_ROOT, 'manifest.webmanifest'),
      ...defaultHtmlPagesToPrecache,
      ...popularHtmlPages
    ]
  })
}

await main()
