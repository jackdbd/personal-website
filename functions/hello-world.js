// https://developers.cloudflare.com/pages/platform/functions/
export async function onRequest(context) {
  // Contents of context object
  const {
    request, // same as existing Worker API
    env, // same as existing Worker API
    params, // if filename includes [id] or [[path]]
    waitUntil, // same as ctx.waitUntil in existing Worker API
    next, // used for middleware or to fetch assets
    data // arbitrary space for passing data between middlewares
  } = context

  console.log('🚀 ~ onRequest ~ env', env)
  console.log('🚀 ~ onRequest ~ data', data)
  console.log('🚀 ~ onRequest ~ params', params)

  return new Response('Hello, world!!!')
}
