// https://github.com/GoogleChrome/workbox/blob/v6/packages/workbox-cacheable-response/package.json

const cacheDidUpdate = async (stuff) => {
  // No return expected
  // Note: `newResponse.bodyUsed` is `true` when this is called,
  // meaning the body has already been read. If you need access to
  // the body of the fresh response, use a technique like:
  // const freshResponse = await caches.match(request, {cacheName});
}

const cacheKeyWillBeUsed = async (stuff) => {
  const { request } = stuff
  // `request` is the `Request` object that would otherwise be used as the cache key.
  // `mode` is either 'read' or 'write'.
  // Return either a string, or a `Request` whose `url` property will be used as the cache key.
  // Returning the original `request` will make this a no-op.
  return request
}

const fetchDidSucceed = async (stuff) => {
  const { response } = stuff

  // Return `response` to use the network response as-is,
  // or alternatively create and return a new `Response` object.
  return response
}

const requestWillFetch = async (stuff) => {}

// https://github.com/tpiros/cloudinary-workbox-plugin
// https://developer.chrome.com/docs/workbox/reference/workbox-core/#type-WorkboxPlugin
const demoPlugin = {
  cacheDidUpdate,
  cacheKeyWillBeUsed,
  fetchDidSucceed,
  requestWillFetch
}

module.exports = demoPlugin
