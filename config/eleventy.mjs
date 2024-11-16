import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defDebug from 'debug'
import markdownIt from 'markdown-it'
import markdownItAnchor from 'markdown-it-anchor'
import { EleventyRenderPlugin } from '@11ty/eleventy'
import navigation from '@11ty/eleventy-navigation'
import rss from '@11ty/eleventy-plugin-rss'
import syntaxHighlight from '@11ty/eleventy-plugin-syntaxhighlight'
import webcPlugin from '@11ty/eleventy-plugin-webc'
import pluginWebmentions from '@chrisburnell/eleventy-cache-webmentions'
import { ensureEnvVarsPlugin } from '@jackdbd/eleventy-plugin-ensure-env-vars'
import { telegramPlugin } from '@jackdbd/eleventy-plugin-telegram'
import { textToSpeechPlugin } from '@jackdbd/eleventy-plugin-text-to-speech'
import { defClient as defCloudStorage } from '@jackdbd/eleventy-plugin-text-to-speech/hosting/cloud-storage'
import { defClient as defCloudTextToSpeech } from '@jackdbd/eleventy-plugin-text-to-speech/synthesis/gcp-text-to-speech'
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
import { stripePlugin } from '../plugins/11ty/stripe/index.mjs'
import { webmentionsPlugin } from '../plugins/11ty/webmentions/index.mjs'
import wm_data from '../src/_data/webmentions.mjs'

const debug = defDebug(`11ty-config:eleventy.mjs`)

const __filename = fileURLToPath(import.meta.url)
const REPO_ROOT = path.join(__filename, '..', '..')
const OUTPUT_DIR = path.join(REPO_ROOT, '_site')

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

  // TIP: think twice before writing code inside a `eleventy.after` event
  // handler. If you need code here, most likely you are better off writing a
  // standalone script which works with any static site, not just with the ones
  // built with Eleventy.
  // eleventyConfig.on('eleventy.after', async () => {})

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
    // keyFilename = path.join(REPO_ROOT, 'secrets', 'sa-storage-uploader.json')
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
      path.join(REPO_ROOT, 'secrets', 'stripe-live.json'),
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

  eleventyConfig.addPlugin(webmentionsPlugin, {
    blacklisted: [
      { id: 1598904, reason: 'it was a webmention I sent for testing' }
    ],
    domain: 'www.giacomodebidda.com',
    token: process.env.WEBMENTION_IO_TOKEN
  })

  // https://github.com/chrisburnell/eleventy-cache-webmentions?tab=readme-ov-file#installation
  eleventyConfig.addPlugin(pluginWebmentions, {
    domain: `https://${wm_data.webmentions_domain}`,
    feed: wm_data.webmentions_feed,
    key: wm_data.webmentions_key,
    directory: wm_data.webmentions_directory
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
      'plugins/11ty/webmentions/components/**/*.webc',
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
    'src/includes/assets/oauth-authorization-server.json':
      '.well-known/oauth-authorization-server',
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
      input: 'tmp',
      layouts: 'layouts',
      output: OUTPUT_DIR
    },
    htmlTemplateEngine: 'njk',
    markdownTemplateEngine: 'njk',
    pathPrefix: '/',
    templateFormats: ['json', 'md', 'njk']
  }
}
