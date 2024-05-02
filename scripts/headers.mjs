import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defDebug from 'debug'
import { cspHeader } from '@jackdbd/content-security-policy'
import { updateHeaders } from '@jackdbd/hosting-utils'
import { permissionsPolicy } from '@jackdbd/permissions-policy'

export const __filename = fileURLToPath(import.meta.url)
const SCRIPT_NAME = path.basename(__filename, '.ts')
const debug = defDebug(`script:${SCRIPT_NAME}`)

const REPO_ROOT = path.join(__filename, '..', '..')
const SITE_ROOT = path.join(REPO_ROOT, '_site')

// interface UpdatePatch {
//   filepath: string
//   headerKey: string
//   headerValue: string
//   sources: string[]
// }

async function* patchConsumer(patches) {
  while (patches.length) {
    const patch = patches[0]

    const { error, value } = await updateHeaders(patch)
    if (error) {
      throw error
    } else {
      debug(value)
    }

    yield patches.shift()
  }
}

// consume the async generator
const consume = async (agen) => {
  for await (const result of agen) {
  }
}

const main = async () => {
  // const args = process.argv.slice(2)

  const domain = 'www.giacomodebidda.com'
  const sendWebmentionFormSubmissionUrl = `https://webmention.io/${domain}/webmention`
  const contactFormSubmissionUrl = 'https://formspree.io/f/mrgdevqb'

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

  const directives = {
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
      // Down below there is the exact data URI of the SVG inlined by the
      // pagefind-ui search widget. The problem is that it's extremely long, and
      // Cloudflare Pages imposes a limit of 2000 character to the length of each
      // header declared in the _headers file.
      // `data:image/svg+xml,%3Csvg width='18' height='18' viewBox='0 0 18 18' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M12.7549 11.255H11.9649L11.6849 10.985C12.6649 9.845 13.2549 8.365 13.2549 6.755C13.2549 3.165 10.3449 0.255005 6.75488 0.255005C3.16488 0.255005 0.254883 3.165 0.254883 6.755C0.254883 10.345 3.16488 13.255 6.75488 13.255C8.36488 13.255 9.84488 12.665 10.9849 11.685L11.2549 11.965V12.755L16.2549 17.745L17.7449 16.255L12.7549 11.255ZM6.75488 11.255C4.26488 11.255 2.25488 9.245 2.25488 6.755C2.25488 4.26501 4.26488 2.255 6.75488 2.255C9.24488 2.255 11.2549 4.26501 11.2549 6.755C11.2549 9.245 9.24488 11.255 6.75488 11.255Z' fill='%23000000'/%3E%3C/svg%3E%0A`
      // This is obviously less safe, but it takes a lot less space in the header.
      // https://stackoverflow.com/questions/18447970/content-security-policy-data-not-working-for-base64-images-in-chrome-28
      'data:'
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
  }

  const patterns = [path.join(SITE_ROOT, '**/*.html')]
  debug(`patterns: %O`, patterns)
  debug(`directives: %O`, directives)
  const csp = await cspHeader({ patterns, directives })
  debug(
    'Here is the Content-Security-Policy you can use for all resources matching these patterns %O',
    patterns
  )
  console.log(csp)

  const reporting_endpoints = {
    default: `"https://giacomodebidda.uriports.com/reports"`,
    csp: `"https://giacomodebidda.uriports.com/reports"`,
    'permissions-policy': `"https://giacomodebidda.uriports.com/reports"`
  }

  debug(`reports and policy violations will be sent to these endpoints %O`, {
    reporting_endpoints
  })

  const reportingEndpoints = Object.entries(reporting_endpoints)
    .map(([key, value]) => {
      return `${key}=${value}`
    })
    .join(', ')

  const filepath = path.join(SITE_ROOT, '_headers')

  // The _headers file for Cloudflare Pages is a bit tricky
  // https://developers.cloudflare.com/pages/configuration/headers/
  // attach headers to every resource
  //   const sources = ['/*']
  // attach headers to the home page and ALL posts
  //   const sources = ['/', '/posts/*']
  // attach header to the home page, the 404 page and a specific post
  const sources = ['/', '/404', '/posts/playwright-on-nixos/']

  const { error, value: pp } = permissionsPolicy({
    features: {
      accelerometer: [],
      camera: [],
      // 'ch-width': ['self', 'https://res.cloudinary.com'],
      // 'ch-dpr': ['self', 'https://res.cloudinary.com'],
      geolocation: [],
      gyroscope: [],
      magnetometer: [],
      microphone: [],
      payment: [],
      usb: []
    },
    reportingEndpoint: 'permissions-policy' // or 'default'
  })
  if (error) {
    console.error(error)
    return
  }

  const patches = [
    {
      headerKey: 'Accept-CH',
      headerValue:
        'Save-Data,DPR,Width,Sec-CH-Prefers-Reduced-Data,Sec-CH-DPR,Sec-CH-Width',
      filepath,
      sources
    },
    {
      headerKey: 'Content-Security-Policy',
      headerValue: csp,
      filepath,
      sources
    },
    // {
    //   headerKey: 'Feature-Policy',
    //   headerValue: fp,
    //   filepath,
    //   sources
    // },
    {
      headerKey: 'Permissions-Policy',
      headerValue: pp,
      filepath,
      sources
    },
    {
      headerKey: 'Reporting-Endpoints',
      headerValue: reportingEndpoints,
      filepath,
      sources
    },
    {
      headerKey: 'Strict-Transport-Security',
      headerValue: 'max-age=31536000; includeSubDomains; preload',
      filepath,
      sources
    },
    // TODO: this messes up the content of _headers. Not sure why...
    // Prevent any *.pages.dev deployment from being indexed by search engines
    // https://developers.cloudflare.com/pages/platform/headers/
    // prevent-your-pagesdev-deployments-showing-in-search-results
    // {
    //   headerKey: 'X-Robots-Tag',
    //   headerValue: 'noindex',
    //   filepath,
    //   sources: ['https://:project.pages.dev/*']
    // },
    {
      headerKey: 'Cache-Control',
      headerValue: 'no-store, max-age=0',
      filepath,
      sources: ['/sw.js']
    },
    {
      headerKey: 'Content-Type',
      headerValue: 'application/javascript; charset=utf-8',
      filepath,
      sources: ['/sw.js']
    }
    // TODO: serve the OpenPGP public key as plain text (Content-Type: text/plain; charset=utf-8)
    // https://www.giacomodebidda.com/assets/pgp-key.txt
  ]

  consume(patchConsumer(patches))
}

await main()
