const fs = require('node:fs')
const { join } = require('node:path')
const markdownIt = require('markdown-it')
const markdownItAnchor = require('markdown-it-anchor')
const globbyPromise = import('globby')
const { EleventyRenderPlugin } = require('@11ty/eleventy')
const navigation = require('@11ty/eleventy-navigation')
const rss = require('@11ty/eleventy-plugin-rss')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const webcPlugin = require('@11ty/eleventy-plugin-webc')
const UpgradeHelper = require('@11ty/eleventy-upgrade-help')
const cspPlugin = require('@jackdbd/eleventy-plugin-content-security-policy')
const {
  ensureEnvVarsPlugin
} = require('@jackdbd/eleventy-plugin-ensure-env-vars')
const { telegramPlugin } = require('@jackdbd/eleventy-plugin-telegram')
const {
  plugin: textToSpeechPlugin
} = require('@jackdbd/eleventy-plugin-text-to-speech')
const brokenLinksPlugin = require('eleventy-plugin-broken-links')
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
const plausibleClientPromise = import('@jackdbd/plausible-client')
const plausiblePlugin = require('../plugins/11ty/plausible/index.cjs')
const webmentionsPlugin = require('../plugins/11ty/webmentions/index.cjs')
const { buildServiceWorker } = require('../src/build-sw.cjs')

const REPO_ROOT = join(__filename, '..', '..')
const OUTPUT_DIR = join(REPO_ROOT, '_site')
// const ASSETS_DIR = join(REPO_ROOT, 'assets')

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
  let popularHtmlPages = []

  // https://www.11ty.dev/docs/data-global-custom/
  // https://benmyers.dev/blog/eleventy-data-cascade/
  const contactFormSubmissionUrl = 'https://formspree.io/f/mrgdevqb'
  eleventyConfig.addGlobalData(
    'contactFormSubmissionUrl',
    contactFormSubmissionUrl
  )

  eleventyConfig.addPlugin(ensureEnvVarsPlugin, {
    envVars: ['DEBUG', 'ELEVENTY_ENV', 'NODE_ENV']
  })

  eleventyConfig.on('eleventy.before', async () => {
    // on GitHub Actions I use a JSON secret for Plausible API key and site ID,
    // and I expose that secret as an environment variable.
    let plausible_json_string
    if (process.env.PLAUSIBLE) {
      plausible_json_string = process.env.PLAUSIBLE
    } else {
      plausible_json_string = fs.readFileSync(
        join(REPO_ROOT, 'secrets', 'plausible.json'),
        { encoding: 'utf8' }
      )
    }
    const plausible = JSON.parse(plausible_json_string)

    const { makeClient } = await plausibleClientPromise
    const client = makeClient(
      {
        apiKey: plausible.api_key,
        siteId: plausible.site_id
      },
      { verbose: true }
    )
    const results = await client.stats.breakdown()
    // console.log('=== Plausible.io stats/ breakdown ===')
    popularHtmlPages = results
      .filter((res) => res.visitors > 50)
      .map((res) => {
        // console.log('res', res)
        const filepath = `${OUTPUT_DIR}${res.page}index.html`
        // console.log('filepath', filepath)
        return filepath
      })
  })

  eleventyConfig.on('eleventy.after', async () => {
    const defaultHtmlPagesToPrecache = [
      join(OUTPUT_DIR, '404.html'),
      join(OUTPUT_DIR, 'index.html'),
      join(OUTPUT_DIR, 'about', 'index.html'),
      join(OUTPUT_DIR, 'blog', 'index.html'),
      join(OUTPUT_DIR, 'contact', 'index.html'),
      join(OUTPUT_DIR, 'projects', 'index.html')
    ]
    // console.log('=== popularHtmlPages ===', popularHtmlPages)

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
      // `${OUTPUT_DIR}/assets/**/*.css`,
      // `${OUTPUT_DIR}/assets/**/*.js`,
      `${OUTPUT_DIR}/assets/**/*.{ico,svg}`,
      `${OUTPUT_DIR}/assets/**/*.{woff,woff2}`
    ]
    const module = await globbyPromise
    const globby = module.globby
    const assetPaths = await globby(patterns)

    await buildServiceWorker({
      precachePaths: [
        ...assetPaths,
        // I think precaching the manifest.webmanifest is required to make the
        // website usable offline.
        join(OUTPUT_DIR, 'manifest.webmanifest'),
        ...defaultHtmlPagesToPrecache,
        ...popularHtmlPages
        // join(OUTPUT_DIR, 'assets', 'fonts', 'nunito-v16-latin-800.woff2	')
      ]
    })
  })

  let keyFilename
  if (process.env.GCP_CREDENTIALS_JSON) {
    keyFilename = 'credentials.json'
    fs.writeFileSync(keyFilename, process.env.GCP_CREDENTIALS_JSON)

    // I also have to set GOOGLE_APPLICATION_CREDENTIALS as a filepath because
    // when the eleventy-text-to-speech-plugin is registered without passing
    // `keyFilename`, it uses the environment variable
    // GOOGLE_APPLICATION_CREDENTIALS. That plugin expects
    // GOOGLE_APPLICATION_CREDENTIALS to be a filepath (as it should always be).
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilename
  } else {
    // on my laptop, I keep the JSON key in the secrets/ directory
    keyFilename = join(REPO_ROOT, 'secrets', 'sa-storage-uploader.json')
    process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilename
  }

  // https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables
  // https://www.11ty.dev/docs/environment-vars/
  const environment = {
    CF_PAGES: process.env.CF_PAGES,
    CF_PAGES_BRANCH: process.env.CF_PAGES_BRANCH,
    CF_PAGES_COMMIT_SHA: process.env.CF_PAGES_COMMIT_SHA,
    CF_PAGES_URL: process.env.CF_PAGES_URL,
    DEBUG: process.env.DEBUG,
    ELEVENTY_ENV: process.env.ELEVENTY_ENV,
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    NODE_ENV: process.env.NODE_ENV,
    SA_JSON_KEY: process.env.SA_JSON_KEY
  }
  // console.log('environment', environment)

  // --- 11ty plugins ------------------------------------------------------- //

  // https://www.11ty.dev/docs/plugins/render/#installation
  eleventyConfig.addPlugin(EleventyRenderPlugin)

  // https://github.com/bradleyburgess/eleventy-plugin-broken-links
  eleventyConfig.addPlugin(brokenLinksPlugin, {
    cacheDuration: '7d',
    callback: (brokenLinks, redirectLinks) => {
      if (brokenLinks.length > 0) {
        // throw new Error(`${brokenLinks.length} BROKEN LINKS`)
        console.log(`!!! ${brokenLinks.length} BROKEN links`)
        console.log(brokenLinks)
        process.exit(1)
      }
      if (redirectLinks.length > 0) {
        console.log(`!!! ${redirectLinks.length} REDIRECT links`)
        console.log(redirectLinks)
      }
    },
    excludeUrls: [
      // these articles seem no longer online. What can I do? Just remove them from blog posts? Replace them with similar articles?
      'https://www.oscarberg.net/blog/2012/05/invisible-manager/',
      'https://getdango.com/emoji-and-deep-learning/',
      // I don't know why there is a HTTP (not HTTPS!) redirect for this...
      'http://Kepler.gl',
      // several YouTube pages return HTTP 302. They shouldn't be an issue.
      'https://www.youtube.com/watch?v=b9yL5usLFgY',
      'https://www.youtube.com/watch?v=lC39ifspIf4',
      // several Wikipedia pages return HTTP 302. They shouldn't be an issue.
      'https://en.wikipedia.org/wiki/*',
      // the plugin marks this as a HTTP 403, but it seems a HTTP 200 to me.
      'https://www.cloudflare.com/learning/cdn/glossary/origin-server/',
      // I don't know why these are marked as broken links. They seem fine to me...
      'https://all-geo.org/volcan01010/',
      'https://www.cairographics.org/',
      'https://www.qlik.com/blog/visual-encoding'
    ],
    loggingLevel: 2
  })

  // on GitHub Actions I use a JSON secret for Plausible API key and site ID,
  // and I expose that secret as an environment variable.
  let plausible_json_string
  if (process.env.PLAUSIBLE) {
    plausible_json_string = process.env.PLAUSIBLE
  } else {
    plausible_json_string = fs.readFileSync(
      join(REPO_ROOT, 'secrets', 'plausible.json'),
      { encoding: 'utf8' }
    )
  }
  const plausible = JSON.parse(plausible_json_string)

  eleventyConfig.addPlugin(plausiblePlugin, {
    apiKey: plausible.api_key,
    siteId: plausible.site_id
  })

  const domain = 'www.giacomodebidda.com'

  eleventyConfig.addPlugin(webmentionsPlugin, {
    domain,
    token: process.env.WEBMENTION_IO_TOKEN
  })

  const scriptSrcElem = [
    'self',
    'https://plausible.io/js/plausible.js',
    'https://static.cloudflareinsights.com/beacon.min.js',
    'https://unpkg.com/htm/preact/standalone.module.js'
  ]

  const styleSrcElem = ['self', 'sha256']

  eleventyConfig.addPlugin(cspPlugin, {
    allowDeprecatedDirectives: true,
    directives: {
      'base-uri': ['self'],

      'connect-src': [
        'self',
        'cloudflareinsights.com',
        'plausible.io',
        // 'https://plausible.io/api/event',
        'res.cloudinary.com'
      ],

      'default-src': ['none'],

      'font-src': ['self'],

      // allow form submissions to Formspree
      'form-action': ['self', contactFormSubmissionUrl],

      'frame-ancestors': ['none'],

      // allow embedding iframes from these websites (cross-origin iframes)
      'frame-src': [
        'https://www.youtube.com/embed/',
        'https://www.youtube-nocookie.com/',
        'https://player.vimeo.com/video/',
        'slides.com'
      ],

      // allow loading images hosted on GitHub, Cloudinary, Webmention.io
      'img-src': [
        'self',
        'github.com',
        'raw.githubusercontent.com',
        'res.cloudinary.com',
        'webmention.io',
        // webmention.io hosts here the avatars of the Twitter users that sent me a webmention
        'https://s3-us-west-2.amazonaws.com/ca3db/pbs.twimg.com/',
        // webmention.io hosts here the avatar of webmention.rocks
        'https://s3-us-west-2.amazonaws.com/ca3db/webmention.rocks/'
      ],

      'manifest-src': ['self'],

      // allow <audio> and <video> hosted on Cloud Storage
      'media-src': ['storage.googleapis.com'],

      'object-src': ['none'],

      'prefetch-src': ['self'],

      // allow to report to the group called "default". See Report-To header.
      'report-to': ['default'],

      // TODO: If I use require-trusted-types-for, I also need to configure
      // TrustedScriptURL, otherwise the service worker installation fails.
      // https://developer.mozilla.org/en-US/docs/Web/API/TrustedScriptURL
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/trusted-types
      // https://javascript.tutorialink.com/this-document-requires-trustedscripturl-assignment/
      // 'require-trusted-types-for': ['script'],

      // report-uri is deprecated in favor of report-to, but Firefox still does
      // not support report-to (it only supports report-uri).
      'report-uri': ['https://giacomodebidda.report-uri.com/r/d/csp/enforce'],

      // allow scripts hosted on this origin, on plausible.io (analytics),
      // cloudflareinsights.com (analytics), unpkg.com (preact)
      // Firefox and Safari on iOS do not support script-src-elem, so we need a
      // fallback to script-src.
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src-elem
      'script-src': [...scriptSrcElem],
      'script-src-elem': [...scriptSrcElem],

      // allow CSS hosted on this origin, and inline styles that match a sha256
      // hash automatically computed at build time by this 11ty plugin.
      // See also here for the pros and cons of 'unsafe-inline'
      // https://stackoverflow.com/questions/30653698/csp-style-src-unsafe-inline-is-it-worth-it
      // Firefox and Safari on iOS do not support style-src-elem, so we need a
      // fallback to style-src.
      // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/style-src-elem
      // 'style-src': [...styleSrcElem],
      // 'style-src-elem': [...styleSrcElem],
      // TODO: it seems that WebC components include some inline styles and I
      // don't know how to compute the SHA256 for those. There should a way to
      // bundle together all CSS generated by WebC components.
      // For now I simply allow 'unsafe-inline'
      'style-src': ['self', 'unsafe-inline'],
      'style-src-elem': ['self', 'unsafe-inline'],

      'upgrade-insecure-requests': true,

      // allow service workers, workers and shared workers hosted on the this origin
      'worker-src': ['self']
    },
    globPatternsDetach: ['/*.png'],
    includePatterns: ['/**/**.html'],
    excludePatterns: [],
    jsonRecap: true
    // reportOnly: true
  })

  // https://github.com/gfscott/eleventy-plugin-embed-twitter#configure
  eleventyConfig.addPlugin(embedTwitter, { align: 'center', doNotTrack: true })
  eleventyConfig.addPlugin(embedVimeo, { dnt: true })
  eleventyConfig.addPlugin(embedYouTube, { lazy: true, noCookie: true })

  let cloudinary_json_string
  if (process.env.CLOUDINARY) {
    cloudinary_json_string = process.env.CLOUDINARY
  } else {
    cloudinary_json_string = fs.readFileSync(
      join(REPO_ROOT, 'secrets', 'cloudinary.json'),
      { encoding: 'utf8' }
    )
  }
  const cloudinary = JSON.parse(cloudinary_json_string)

  eleventyConfig.addPlugin(embedCloudinary, {
    apiKey: cloudinary.api_key,
    apiSecret: cloudinary.api_secret,
    cloudName: cloudinary.cloud_name
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

  // see full list of options here:
  // https://www.11ty.dev/docs/languages/webc/#installation
  eleventyConfig.addPlugin(webcPlugin, {
    components: 'src/includes/components/**/*.webc'
  })

  if (process.env.CF_PAGES) {
    // on GitHub Actions I use a JSON secret for Telegram chat ID and token, and I
    // expose that secret as an environment variable.
    let telegram_json_string
    if (process.env.TELEGRAM) {
      telegram_json_string = process.env.TELEGRAM
    } else {
      telegram_json_string = fs.readFileSync(
        join(REPO_ROOT, 'secrets', 'telegram.json'),
        { encoding: 'utf8' }
      )
    }
    const telegram = JSON.parse(telegram_json_string)

    eleventyConfig.addPlugin(telegramPlugin, {
      chatId: telegram.chat_id,
      token: telegram.token,
      textBeforeBuild: '11ty has just <b>started</b> building my personal site',
      textAfterBuild: '🏁 11ty has <b>finished</b> building my personal website'
    })
  }

  eleventyConfig.addPlugin(textToSpeechPlugin, {
    audioHost: {
      bucketName: 'bkt-eleventy-plugin-text-to-speech-audio-files',
      keyFilename
    },
    keyFilename,
    rules: [
      {
        regex: new RegExp('about\\/index\\.html$'),
        cssSelectors: ['.text-to-speech']
      }
    ],
    // https://cloud.google.com/text-to-speech/docs/voices
    voice: 'en-US-Wavenet-I'
  })

  // UpgradeHelper must be added last
  eleventyConfig.addPlugin(UpgradeHelper)

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
    'src/includes/assets/pgp-key.txt': 'assets/pgp-key.txt',
    'src/includes/assets/security.txt': '.well-known/security.txt',
    'node_modules/@11ty/is-land/is-land.js': 'assets/js/is-land.js',
    'node_modules/instant.page/instantpage.js': 'assets/js/instantpage.js',
    'node_modules/htm/dist/htm.module.js': 'assets/js/htm.module.js',
    'node_modules/preact/dist/preact.module.js': 'assets/js/preact.module.js'
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

  // --- Eleventy dev server configuration ---------------------------------- //

  // https://www.11ty.dev/docs/dev-server/
  eleventyConfig.setServerOptions({
    liveReload: true,
    domDiff: true,
    port: 8080
  })

  // https://www.11ty.dev/docs/config/#configuration-options
  return {
    dir: {
      data: '_data',
      includes: 'includes',
      input: 'src',
      layouts: 'layouts',
      output: OUTPUT_DIR
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    pathPrefix: '/'
  }
}
