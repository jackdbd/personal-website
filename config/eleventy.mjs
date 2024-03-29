import fs from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import makeDebug from 'debug'
import { globby } from 'globby'
import markdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import { EleventyRenderPlugin } from '@11ty/eleventy'
import navigation from '@11ty/eleventy-navigation'
import rss from '@11ty/eleventy-plugin-rss'
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight'
import webcPlugin from '@11ty/eleventy-plugin-webc'
import { contentSecurityPolicyPlugin } from '@jackdbd/eleventy-plugin-content-security-policy'
import { ensureEnvVarsPlugin } from '@jackdbd/eleventy-plugin-ensure-env-vars'
import { telegramPlugin } from '@jackdbd/eleventy-plugin-telegram'
import { textToSpeechPlugin } from '@jackdbd/eleventy-plugin-text-to-speech'
import { defClient as defCloudStorage } from '@jackdbd/eleventy-plugin-text-to-speech/hosting/cloud-storage'
import { defClient as defCloudTextToSpeech } from '@jackdbd/eleventy-plugin-text-to-speech/synthesis/gcp-text-to-speech'
import brokenLinksPlugin from 'eleventy-plugin-broken-links'
import embedTwitter from 'eleventy-plugin-embed-twitter'
import embedVimeo from 'eleventy-plugin-vimeo-embed'
import embedYouTube from 'eleventy-plugin-youtube-embed'
import emoji from 'eleventy-plugin-emoji'
import helmet from 'eleventy-plugin-helmet'
import readingTime from 'eleventy-plugin-reading-time'
import toc from 'eleventy-plugin-nesting-toc'
import collections from '../11ty/collections.mjs'
import filters from '../11ty/filters.mjs'
import shortcodes from '../11ty/shortcodes.mjs'
import { callout, table } from '../11ty/paired-shortcodes.mjs'
import { htmlmin } from '../11ty/transforms.mjs'
import cloudinaryPlugin from '../plugins/11ty/cloudinary/index.cjs'
import { pagefindPlugin } from '../plugins/11ty/pagefind/index.mjs'
import stripePlugin from '../plugins/11ty/stripe/index.cjs'
import webmentionsPlugin from '../plugins/11ty/webmentions/index.cjs'
import { buildServiceWorker } from '../src/build-sw.cjs'

const debug = makeDebug(`11ty-config:eleventy.mjs`)

const __filename = fileURLToPath(import.meta.url)
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

export default function (eleventyConfig) {
  let popularHtmlPages = []

  // https://www.11ty.dev/docs/data-global-custom/
  // https://benmyers.dev/blog/eleventy-data-cascade/
  const contactFormSubmissionUrl = 'https://formspree.io/f/mrgdevqb'

  eleventyConfig.addGlobalData(
    'contactFormSubmissionUrl',
    contactFormSubmissionUrl
  )

  eleventyConfig.addPlugin(ensureEnvVarsPlugin, {
    envVars: [
      'CLOUDINARY',
      'DEBUG',
      'ELEVENTY_ROOT',
      'ELEVENTY_SOURCE',
      'ELEVENTY_RUN_MODE',
      'NODE_ENV'
    ]
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
    const assetPaths = await globby(patterns)

    await buildServiceWorker({
      precachePaths: [
        ...assetPaths,
        // I think precaching the manifest.webmanifest is required to make the
        // website usable offline.
        join(OUTPUT_DIR, 'manifest.webmanifest'),
        ...defaultHtmlPagesToPrecache,
        ...popularHtmlPages
      ]
    })
  })

  let keyFilename
  // on GitHub Actions and on Cloudflare Pages, I set GCP_CREDENTIALS_JSON as a JSON string.
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
    // on my NixOS laptop, I have a secret stored on the filesystem
    keyFilename = undefined
    // on my non-NixOS laptop, I keep the JSON key in the secrets/ directory
    // keyFilename = join(REPO_ROOT, 'secrets', 'sa-storage-uploader.json')
    // process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilename
  }

  const environment = {
    // environment variables set by Cloudflare Pages
    // https://developers.cloudflare.com/pages/platform/build-configuration/#environment-variables
    CF_PAGES: process.env.CF_PAGES,
    CF_PAGES_BRANCH: process.env.CF_PAGES_BRANCH,
    CF_PAGES_COMMIT_SHA: process.env.CF_PAGES_COMMIT_SHA,
    CF_PAGES_URL: process.env.CF_PAGES_URL,

    CLOUDINARY: process.env.CLOUDINARY,
    DEBUG: process.env.DEBUG,

    // environment variables set by Eleventy
    // https://www.11ty.dev/docs/environment-vars/#eleventy-supplied
    ELEVENTY_ROOT: process.env.ELEVENTY_ROOT,
    ELEVENTY_RUN_MODE: process.env.ELEVENTY_RUN_MODE,
    ELEVENTY_SERVERLESS: process.env.ELEVENTY_SERVERLESS,
    ELEVENTY_SOURCE: process.env.ELEVENTY_SOURCE,

    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    NODE_ENV: process.env.NODE_ENV,
    SA_JSON_KEY: process.env.SA_JSON_KEY
  }
  // console.log('environment', environment)

  // --- 11ty plugins ------------------------------------------------------- //

  // https://www.11ty.dev/docs/plugins/render/#installation
  eleventyConfig.addPlugin(EleventyRenderPlugin)

  // https://github.com/bradleyburgess/eleventy-plugin-broken-links
  // eleventyConfig.addPlugin(brokenLinksPlugin, {
  //   cacheDuration: '7d',
  //   callback: (brokenLinks, redirectLinks) => {
  //     if (brokenLinks.length > 0) {
  //       // throw new Error(`${brokenLinks.length} BROKEN LINKS`)
  //       console.log(`!!! ${brokenLinks.length} BROKEN links`)
  //       console.log(brokenLinks)
  //       process.exit(1)
  //     }
  //     if (redirectLinks.length > 0) {
  //       console.log(`!!! ${redirectLinks.length} REDIRECT links`)
  //       console.log(redirectLinks)
  //     }
  //   },
  //   excludeUrls: [
  //     // broken links. I cannot do anything about them.
  //     'http://dati.regione.sardegna.it/dataset/cfva-perimetrazioni-aree-percorse-dal-fuoco-2005',
  //     'http://dati.regione.sardegna.it/dataset/cfva-perimetrazioni-aree-percorse-dal-fuoco-2016',
  //     // these articles seem no longer online. What can I do? Just remove them from blog posts? Replace them with similar articles?
  //     'https://www.oscarberg.net/blog/2012/05/invisible-manager/',
  //     'https://getdango.com/emoji-and-deep-learning/',
  //     // I don't know why there is a HTTP (not HTTPS!) redirect for this...
  //     'http://Kepler.gl',
  //     // several YouTube pages return HTTP 302. They shouldn't be an issue.
  //     'https://www.youtube.com/watch?v=b9yL5usLFgY',
  //     'https://www.youtube.com/watch?v=lC39ifspIf4',
  //     // several Wikipedia pages return HTTP 302. They shouldn't be an issue.
  //     'https://en.wikipedia.org/wiki/*',
  //     // the plugin marks this as a HTTP 403, but it seems a HTTP 200 to me.
  //     'https://www.cloudflare.com/learning/cdn/glossary/origin-server/',
  //     // I don't know why these are marked as broken links. They seem fine to me...
  //     'https://all-geo.org/volcan01010/',
  //     'https://www.cairographics.org/',
  //     'http://Genius.com',
  //     'https://genius.com/a/infographic-how-dragon-ball-influenced-a-generation-of-hip-hop-artists',
  //     'https://www.qlik.com/blog/visual-encoding'
  //   ],
  //   loggingLevel: 1
  // })

  let stripe_json_string
  if (process.env.STRIPE_LIVE) {
    stripe_json_string = process.env.STRIPE_LIVE
  } else {
    stripe_json_string = fs.readFileSync(
      join(REPO_ROOT, 'secrets', 'stripe-live.json'),
      { encoding: 'utf8' }
    )
  }
  const stripe = JSON.parse(stripe_json_string)

  eleventyConfig.addPlugin(stripePlugin, {
    apiKey: stripe.api_key,
    stripeConfig: {
      // https://stripe.com/docs/api/versioning
      apiVersion: '2022-11-15',
      maxNetworkRetries: 3, // (default is 0)
      timeout: 10000 // ms (default is 80000)
    }
  })

  const domain = 'www.giacomodebidda.com'
  const sendWebmentionFormSubmissionUrl = `https://webmention.io/${domain}/webmention`

  eleventyConfig.addPlugin(webmentionsPlugin, {
    blacklisted: [
      { id: 1598904, reason: 'it was a webmention I sent for testing' }
    ],
    domain,
    token: process.env.WEBMENTION_IO_TOKEN
  })

  const scriptSrcElem = [
    'self',
    'sha256',
    // required by eleventy-plugin-embed-twitter
    'https://platform.twitter.com',
    // required by Cloudflare Web Analytics
    'https://static.cloudflareinsights.com/beacon.min.js',
    // required by my Preact components
    'https://unpkg.com/htm/preact/standalone.module.js',
    // pagefind-ui.js
    'sha256-K8ITDHA9dtdAedwtkjos9BCZYSdFMrGkfxc9Ge+GJWI=',
    // To compile, instantiate and execute the WebAssembly module used by Pagefind
    // (or any WebAssembly module for that matter), we need either 'unsafe-eval'
    // or 'wasm-unsafe-eval' in the CSP.
    // https://pagefind.app/docs/hosting/#content-security-policy-csp
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution
    // https://caniuse.com/?search=wasm-unsafe-eval
    // https://github.com/WebAssembly/content-security-policy/blob/main/proposals/CSP.md#the-wasm-unsafe-eval-source-directive
    'wasm-unsafe-eval'
  ]

  const styleSrcElem = ['self', 'unsafe-inline']

  eleventyConfig.addPlugin(contentSecurityPolicyPlugin, {
    allowDeprecatedDirectives: false,
    directives: {
      'base-uri': ['self'],

      'connect-src': [
        'self',
        'cloudflareinsights.com',
        'res.cloudinary.com',
        `https://webmention.io/${domain}/webmention`
      ],

      'default-src': ['none'],

      'font-src': ['self'],

      // allow form submissions to Formspree and Webmention.io
      'form-action': [
        'self',
        contactFormSubmissionUrl,
        sendWebmentionFormSubmissionUrl
      ],

      'frame-ancestors': ['none'],

      // allow embedding iframes from these websites (cross-origin iframes)
      'frame-src': [
        // required by eleventy-plugin-embed-twitter
        'https://platform.twitter.com/',
        'https://player.vimeo.com/video/',
        'https://www.youtube.com/embed/',
        'https://www.youtube-nocookie.com/',
        'slides.com'
      ],

      // allow loading images hosted on GitHub, Cloudinary, Webmention.io
      'img-src': [
        'self',
        // I am using a placeholder image hosted on bulma.io
        'bulma.io',
        'github.com',
        'raw.githubusercontent.com',
        'res.cloudinary.com',
        'webmention.io',
        // webmention.io hosts here the avatars of the Twitter users that sent me a webmention
        'https://s3-us-west-2.amazonaws.com/ca3db/pbs.twimg.com/',
        // webmention.io hosts here the avatar of webmention.rocks
        'https://s3-us-west-2.amazonaws.com/ca3db/webmention.rocks/',
        // SVG inlined by the pagefind-ui search widget
        `data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.7549 11.255H11.9649L11.6849 10.985C12.6649 9.845 13.2549 8.365 13.2549 6.755C13.2549 3.165 10.3449 0.255005 6.75488 0.255005C3.16488 0.255005 0.254883 3.165 0.254883 6.755C0.254883 10.345 3.16488 13.255 6.75488 13.255C8.36488 13.255 9.84488 12.665 10.9849 11.685L11.2549 11.965V12.755L16.2549 17.745L17.7449 16.255L12.7549 11.255ZM6.75488 11.255C4.26488 11.255 2.25488 9.245 2.25488 6.755C2.25488 4.26501 4.26488 2.255 6.75488 2.255C9.24488 2.255 11.2549 4.26501 11.2549 6.755C11.2549 9.245 9.24488 11.255 6.75488 11.255Z' fill='%23000000'/%3E%3C/svg%3E%0A`
      ],

      'manifest-src': ['self'],

      // allow <audio> and <video> hosted on Cloudinary, Cloud Storage
      'media-src': ['res.cloudinary.com', 'storage.googleapis.com'],

      'object-src': ['none'],

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
      'style-src': [...styleSrcElem],
      'style-src-elem': [...styleSrcElem],

      // I don't think this is necessary on my site because the site is HSTS-preloaded, but I guess it won't hurt.
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

  const cloudinary = JSON.parse(process.env.CLOUDINARY)

  eleventyConfig.addPlugin(cloudinaryPlugin, {
    apiKey: cloudinary.api_key,
    apiSecret: cloudinary.api_secret,
    cacheDuration: '30d',
    // cacheVerbose: true,
    cloudName: cloudinary.cloud_name
  })

  eleventyConfig.addPlugin(emoji)
  eleventyConfig.addPlugin(helmet)
  eleventyConfig.addPlugin(navigation)
  eleventyConfig.addPlugin(pagefindPlugin, { verbose: true })
  eleventyConfig.addPlugin(readingTime)
  eleventyConfig.addPlugin(rss)
  eleventyConfig.addPlugin(syntaxHighlight)
  eleventyConfig.addPlugin(toc, {
    tags: ['h2', 'h3'],
    wrapperClass: 'toc-nav'
  })

  eleventyConfig.addPlugin(webcPlugin, {
    // https://www.11ty.dev/docs/languages/webc/#global-no-import-components
    components: [
      'src/includes/components/**/*.webc',
      'plugins/11ty/stripe/components/**/*.webc',
      'npm:@11ty/is-land/*.webc',
      'npm:@11ty/eleventy-plugin-syntaxhighlight/*.webc'
    ]
  })

  // On my NixOS laptop, on GitHub Actions and on Cloudflare Pages I use a
  // JSON secret for Telegram chat ID and bot token, and I expose that secret
  // as an environment variable.
  const telegram = JSON.parse(process.env.TELEGRAM)

  if (process.env.CF_PAGES) {
    eleventyConfig.addPlugin(telegramPlugin, {
      chatId: telegram.chat_id,
      token: telegram.token,
      textBeforeBuild:
        '⏱️ 11ty <b>started</b> building <b>personal website</b> on Cloudflare',
      textAfterBuild:
        '🏁 11ty <b>finished</b> building <b>personal website</b> on Cloudflare'
    })
  }

  if (process.env.GITHUB_SHA) {
    eleventyConfig.addPlugin(telegramPlugin, {
      chatId: telegram.chat_id,
      token: telegram.token,
      textBeforeBuild:
        '⏱️ 11ty <b>started</b> building <b>personal website</b> on GitHub',
      textAfterBuild:
        '🏁 11ty <b>finished</b> building <b>personal website</b> on GitHub'
    })
  }

  const cloudTTSFemale = defCloudTextToSpeech({
    audioEncoding: 'OGG_OPUS',
    keyFilename,
    // https://cloud.google.com/text-to-speech/docs/voices
    // voiceName: 'en-US-Wavenet-I'
    voiceName: 'en-GB-Wavenet-C'
  })

  const cloudTTSMale = defCloudTextToSpeech({
    audioEncoding: 'OGG_OPUS',
    keyFilename,
    voiceName: 'en-US-Wavenet-I'
  })

  const cloudStorage = defCloudStorage({
    bucketName: 'bkt-eleventy-plugin-text-to-speech-audio-files',
    keyFilename
  })

  eleventyConfig.addPlugin(textToSpeechPlugin, {
    rules: [
      {
        regex: new RegExp('about\\/.*\\.html$'),
        cssSelectors: ['.text-to-speech'],
        synthesis: cloudTTSMale,
        hosting: cloudStorage
      }
      // This works, but the styling (CSS) sucks.
      // {
      //   regex: new RegExp(
      //     'posts\\/test-your-javascript-on-multiple-engines-with-eshost-cli-and-jsvu\\/.*\\.html$'
      //   ),
      //   cssSelectors: ['call-to-action'],
      //   synthesis: cloudTTSMale,
      //   hosting: cloudStorage
      // }
    ]
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
    'src/includes/assets/xsl': 'assets/xsl',
    'src/includes/preact-components': 'assets/js/preact-components',
    'src/includes/assets/pgp-key.txt': 'assets/pgp-key.txt',
    'src/includes/assets/security.txt': '.well-known/security.txt',
    'node_modules/@11ty/is-land/is-land.js': 'assets/js/is-land.js',
    'node_modules/@11ty/is-land/is-land-autoinit.js':
      'assets/js/is-land-autoinit.js',
    'node_modules/instant.page/instantpage.js': 'assets/js/instantpage.js'
  })

  // https://www.11ty.dev/docs/shortcodes/
  Object.keys(shortcodes).forEach((name) => {
    eleventyConfig.addShortcode(name, shortcodes[name])
    debug(`added 11ty shortcode ${name}`)
  })
  eleventyConfig.addPairedShortcode('callout', callout)
  debug(`added 11ty paired shortcode callout`)
  eleventyConfig.addPairedShortcode('table', table)
  debug(`added 11ty paired shortcode table`)

  // https://www.11ty.dev/docs/config/#transforms
  eleventyConfig.addTransform('htmlmin', htmlmin)
  debug(`added 11ty filter htmlmin`)

  // https://www.11ty.dev/docs/filters/
  Object.keys(filters).forEach((name) => {
    if (name === 'jsmin') {
      eleventyConfig.addAsyncFilter(name, filters[name])
      debug(`added 11ty async filter ${name}`)
    } else {
      eleventyConfig.addFilter(name, filters[name])
      debug(`added 11ty filter ${name}`)
    }
  })

  // https://www.11ty.dev/docs/collections/
  Object.keys(collections).forEach((name) => {
    eleventyConfig.addCollection(name, collections[name])
    debug(`added 11ty collection ${name}`)
  })

  // console.log('11ty user-defined collections', eleventyConfig.collections)

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
    // https://github.com/valeriangalliat/markdown-it-anchor#link-inside-header
    permalink: markdownItAnchor.permalink.linkInsideHeader({
      symbol: `<span aria-hidden="true">#</span>`,
      placement: 'before'
    }),
    // permalink: true,
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
