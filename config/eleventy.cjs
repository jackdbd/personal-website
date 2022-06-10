const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const { env } = require('node:process')

const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')

const navigation = require('@11ty/eleventy-navigation')
const rss = require('@11ty/eleventy-plugin-rss')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')

const embedTwitter = require('eleventy-plugin-embed-twitter')
const embedVimeo = require('eleventy-plugin-vimeo-embed')
const embedYouTube = require('eleventy-plugin-youtube-embed')
const emoji = require('eleventy-plugin-emoji')
const helmet = require('eleventy-plugin-helmet')
const readingTime = require('eleventy-plugin-reading-time')
const toc = require('eleventy-plugin-nesting-toc')
const embedCloudinary = require('eleventy-plugin-embed-cloudinary')

const collections = require('../11ty/collections')
const filters = require('../11ty/filters')
const shortcodes = require('../11ty/shortcodes')
const pairedShortcodes = require('../11ty/paired-shortcodes')
const transforms = require('../11ty/transforms.js')
const reportPrecacheManifestPlugin = require('@jackdbd/eleventy-plugin-report-precache-manifest')
const {
  notifyTelegramChat
} = require('../11ty/plugins/notify-telegram-chat.cjs')
const {
  popularPagesFromAnalyticsOrFallback
} = require('../11ty/plugins/pages-from-analytics.cjs')
const { buildSW } = require('../scripts')

const ROOT = join(__filename, '..', '..')
const OUTPUT_DIR = join(ROOT, '_site')

const ensureEnvironmentVariablesAreSet = async (env_vars) => {
  await Promise.all(
    env_vars.map((env_var) => {
      if (env[env_var] === undefined) {
        throw new Error(`Environment variable ${env_var} not set`)
      } else {
        return true
      }
    })
  )
}

// shamelessly stolen from:
// https://github.com/maxboeck/mxb/blob/db6ca7743f46cf67367a93c8de404cbcb50b98d1/utils/markdown.js
const headingAnchorSlugify = (s) => {
  return encodeURIComponent(
    'h-' +
      String(s)
        .trim()
        .toLowerCase()
        .replace(/[.,\/#!$%\^&\*;:{}=_`~()]/g, '')
        .replace(/\s+/g, '-')
  )
}

module.exports = function (eleventyConfig) {
  eleventyConfig.on('eleventy.before', async () => {
    await notifyTelegramChat({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: `build of site ${env.DOMAIN} started`,
      token: env.TELEGRAM_TOKEN
    })
    const env_vars = [
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'CLOUDINARY_CLOUD_NAME'
    ]
    await ensureEnvironmentVariablesAreSet(env_vars)
  })

  eleventyConfig.on('eleventy.after', async () => {
    const htmlPagesToPrecache = await popularPagesFromAnalyticsOrFallback({
      endpoint: env.ACKEE_API,
      username: env.ACKEE_USERNAME,
      password: env.ACKEE_PASSWORD,
      domainId: env.ACKEE_DOMAIN_ID,
      outputDir: OUTPUT_DIR,
      defaultPagesToPrecache: [
        join(OUTPUT_DIR, '404.html'),
        join(OUTPUT_DIR, 'index.html'),
        join(OUTPUT_DIR, 'about', 'index.html'),
        join(OUTPUT_DIR, 'blog', 'index.html'),
        join(OUTPUT_DIR, 'contact', 'index.html'),
        join(OUTPUT_DIR, 'projects', 'index.html'),
        join(OUTPUT_DIR, 'styleguide', 'index.html'),
        join(OUTPUT_DIR, 'success', 'index.html'),
        join(OUTPUT_DIR, 'tags', 'index.html'),
        join(OUTPUT_DIR, 'posts', '12-years-of-fires-in-sardinia', 'index.html')
      ]
    })

    await buildSW({
      cacheId: 'giacomodebidda.com',
      htmlPagesToPrecache
    })

    await notifyTelegramChat({
      chat_id: env.TELEGRAM_CHAT_ID,
      text: `build of site ${env.DOMAIN} completed`,
      token: env.TELEGRAM_TOKEN
    })
  })

  // --- 11ty plugins ------------------------------------------------------- //

  // https://github.com/gfscott/eleventy-plugin-embed-twitter#configure
  eleventyConfig.addPlugin(embedTwitter, { align: 'center', doNotTrack: true })
  eleventyConfig.addPlugin(embedVimeo, { dnt: true })
  eleventyConfig.addPlugin(embedYouTube, { lazy: true, noCookie: true })
  eleventyConfig.addPlugin(embedCloudinary, {
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    cloudName: env.CLOUDINARY_CLOUD_NAME
  })
  eleventyConfig.addPlugin(emoji)
  eleventyConfig.addPlugin(helmet)
  eleventyConfig.addPlugin(navigation)
  eleventyConfig.addPlugin(readingTime)
  eleventyConfig.addPlugin(rss)
  eleventyConfig.addPlugin(syntaxHighlight)
  eleventyConfig.addPlugin(toc, {
    tags: ['h2', 'h3'],
    wrapperClass: 'toc-nav'
  })

  eleventyConfig.addPlugin(reportPrecacheManifestPlugin, {
    // reportName: 'my-report.json',
    // verbose: true
  })

  // --- 11ty data cascade -------------------------------------------------- //
  // https://www.11ty.dev/docs/data-cascade/

  // Merge data instead of overriding
  // https://www.11ty.dev/docs/data-deep-merge/
  eleventyConfig.setDataDeepMerge(true)

  // --- 11ty passthrough file copy ----------------------------------------- //
  // https://www.11ty.dev/docs/copy/

  // Static assets
  eleventyConfig.addPassthroughCopy({
    'src/includes/assets/css': 'assets/css',
    'src/includes/assets/fonts': 'assets/fonts',
    'src/includes/assets/img': 'assets/img',
    'src/includes/assets/js': 'assets/js',
    'node_modules/instant.page/instantpage.js': 'assets/js/instantpage.js'
  })

  // 11ty shortcodes
  // https://www.11ty.dev/docs/shortcodes/
  Object.keys(shortcodes).forEach((name) => {
    eleventyConfig.addShortcode(name, shortcodes[name])
  })
  Object.keys(pairedShortcodes).forEach((name) => {
    eleventyConfig.addPairedShortcode(name, pairedShortcodes[name])
  })

  // 11ty transforms
  // https://www.11ty.dev/docs/config/#transforms
  Object.keys(transforms).forEach((name) => {
    eleventyConfig.addTransform(name, transforms[name])
  })

  // 11ty filters
  // https://www.11ty.dev/docs/filters/
  Object.keys(filters).forEach((name) => {
    eleventyConfig.addFilter(name, filters[name])
  })

  // 11ty collections
  // https://www.11ty.dev/docs/collections/
  Object.keys(collections).forEach((name) => {
    eleventyConfig.addCollection(name, collections[name])
  })

  // --- markdown-it (markdown parser) configuration ------------------------ //

  // https://markdown-it.github.io/markdown-it/#MarkdownIt.new
  // TODO: try not to set html: true. It's not safe (XSS). Use markdown-it
  // plugins instead!
  const md = markdownIt({
    breaks: true,
    html: true,
    linkify: true,
    typographer: true
  })

  // https://github.com/valeriangalliat/markdown-it-anchor
  md.use(markdownItAnchor, {
    level: 2,
    // permalink: markdownItAnchor.permalink.headerLink(),
    permalink: true,
    permalinkBefore: true,
    permalinkClass: 'heading-anchor',
    permalinkSymbol: '#',
    permalinkAttrs: () => ({ 'aria-hidden': true }),
    slugify: headingAnchorSlugify
  })
  eleventyConfig.setLibrary('md', md)

  // --- Browsersync configuration ------------------------------------------ //

  // https://www.11ty.dev/docs/quicktips/not-found/#with-serve
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, browserSync) {
        const content_404 = readFileSync(join(OUTPUT_DIR, '404.html'))

        browserSync.addMiddleware('*', (req, res) => {
          // Provides the 404 content without redirect.
          res.write(content_404)
          // Add 404 http status code in request header.
          // res.writeHead(404, { "Content-Type": "text/html" });
          res.writeHead(404)
          res.end()
        })
      }
    }
    // ghostMode: false,
    // ui: false
  })

  // https://www.11ty.dev/docs/config/#configuration-options
  return {
    dataTemplateEngine: 'njk',
    dir: {
      data: '_data',
      includes: 'includes',
      input: 'src',
      layouts: 'layouts',
      output: OUTPUT_DIR
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    pathPrefix: '/',
    templateFormats: ['html', 'md', 'njk']
  }
}
