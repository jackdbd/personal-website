import { cacheNames, setCacheNameDetails } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import {
  CacheFirst,
  NetworkOnly,
  StaleWhileRevalidate
} from 'workbox-strategies'
import { registerRoute, setCatchHandler } from 'workbox-routing'

// Have a look at this service worker implemented by the creator of Workbox.
// In particular, he defines a custom Workbox strategy to cache his blog posts.
// https://github.com/jeffposnick/jeffy-info/blob/main/src/service-worker.ts

// Check also this other service worker I created with workbox-build.
// https://github.com/jackdbd/personal-website/blob/e7685da3f1c39457e98223d408c556c724f3ffa3/scripts/build-sw.js#L13

// This method seems to support only one runtime cache, but I want to use
// multiple runtime caches.
// https://developer.chrome.com/docs/workbox/modules/workbox-core/#view-and-change-the-default-cache-names
setCacheNameDetails({
  prefix: 'giacomodebidda-com',
  // suffix: 'v1',
  precache: 'precache'
})

// console.log('cacheNames.precache', cacheNames.precache)
// console.log('cacheNames.runtime', cacheNames.runtime)

// https://developer.chrome.com/docs/workbox/modules/workbox-precaching/#clean-up-old-precaches
cleanupOutdatedCaches()

// https://developer.chrome.com/docs/workbox/modules/workbox-precaching/#serving-precached-responses
precacheAndRoute(process.env.PRECACHE_ENTRIES)

const runtimeCachesNames = {
  css: `${cacheNames.prefix}-css-runtime-cache`,
  fonts: `${cacheNames.prefix}-font-runtime-cache`,
  images: `${cacheNames.prefix}-image-runtime-cache`
}

const matchCssAssets = ({ request, sameOrigin }) => {
  // https://developer.mozilla.org/en-US/docs/Web/API/URLPattern/
  const pattern = new URLPattern({
    pathname: '/assets/css/(.*).css'
  })
  // console.log(`does ${request.url} match CSS?`, pattern.test(request.url))
  return pattern.test(request.url)
}

const matchFontAssets = ({ request }) => request.destination === 'font'

// https://developer.chrome.com/docs/workbox/modules/workbox-routing/
registerRoute(
  matchCssAssets,
  new StaleWhileRevalidate({
    cacheName: runtimeCachesNames.css,
    plugins: [
      // https://developer.chrome.com/docs/workbox/modules/workbox-expiration/
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
        maxEntries: 10
      })
    ]
  })
)

registerRoute(
  matchFontAssets,
  new CacheFirst({
    cacheName: runtimeCachesNames.fonts,
    plugins: [
      // https://developer.chrome.com/docs/workbox/modules/workbox-expiration/
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 5
      })
    ]
  })
)

const matchImgAssets = ({ request }) => request.destination === 'image'

// const matchImgAssets = ({ request, sameOrigin }) => {
//   // https://res.cloudinary.com/jackdbd/image/upload
//   const pattern = new URLPattern({
//     protocol: 'https',
//     hostname: 'res.cloudinary.com'
//   })
//   console.log(
//     `is ${request.url} hosted on Cloudinary?`,
//     pattern.test(request.url)
//   )
//   return pattern.test(request.url)
// }

// The Cache Storage API follows the same-origin policy, so I don't think I can
// cache assets I am not self-hosting (e.g. I can't cache images hosted on
// Cloudinary). TODO: double-check that this is really the case.
// https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
registerRoute(
  matchImgAssets,
  new CacheFirst({
    cacheName: runtimeCachesNames.images,
    plugins: [
      // https://developer.chrome.com/docs/workbox/modules/workbox-expiration/
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 20
      })
    ]
  })
)

// If anything goes wrong when handling a route, return the network response.
setCatchHandler(new NetworkOnly())

// https://stackoverflow.com/questions/49482680/workbox-the-danger-of-self-skipwaiting
self.skipWaiting()
