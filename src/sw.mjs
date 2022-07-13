// import { clientsClaim } from 'workbox-core'
import { precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'

// https://github.com/jeffposnick/jeffy-info/blob/main/src/service-worker.ts

precacheAndRoute([
  { url: '/404.html', revision: '12345' },
  { url: '/index.html', revision: '383676' }
])

registerRoute(
  ({ request }) =>
    new URLPattern({
      pathname: '/assets/images/(.*)'
    }).test(request.url),
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 20
      })
    ]
  })
)
