const fs = require('node:fs')
const crypto = require('node:crypto')
const path = require('node:path')
const util = require('node:util')
const esbuild = require('esbuild')

const PREFIX = '[👷 build-sw]'

const readFileAsync = util.promisify(fs.readFile)

const makeManifestEntry = (outputDir, string) => {
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
  const ROOT = path.join(__filename, '..', '..')
  const outdir = path.join(ROOT, '_site')
  const entryPoint = path.join(ROOT, 'src', 'sw.mjs')

  const headers = await readFileAsync(path.join(outdir, '_headers'), {
    encoding: 'utf8'
  })

  const redirects = await readFileAsync(path.join(outdir, '_redirects'), {
    encoding: 'utf8'
  })

  const manifestEntry = makeManifestEntry(outdir, `${headers}${redirects}`)

  const promises = precachePaths.map((filepath) => manifestEntry(filepath))
  const entries = await Promise.all(promises)
  console.log(`${PREFIX} service worker will precache ${entries.length} URLs:`)
  entries.forEach((entry) => {
    console.log(`  ${entry.url} (rev. ${entry.revision})`)
  })

  const config = {
    bundle: true,
    define: {
      // inject these precache entries in the service worker
      'process.env.PRECACHE_ENTRIES': JSON.stringify(entries, null, 2)
    },
    entryPoints: [entryPoint],
    outdir,
    logLevel: 'debug',
    minify: process.env.ELEVENTY_ENV === 'development' ? false : true,
    platform: 'browser',
    // https://esbuild.github.io/api/#sourcemap
    sourcemap: 'linked',
    // https://esbuild.github.io/api/#target
    // TODO: maybe I could query https://caniuse.com/ for the latest versions of
    // Chrome, Firefox, Safari, and Edge, and use those as the target.
    target: 'esnext'
  }

  // console.log(`${PREFIX} generate service worker with this config`, config)
  const { errors, warnings } = await esbuild.build(config)
  console.log(`${PREFIX} service worker generated`, { errors, warnings })
}

module.exports = { buildServiceWorker }
