export async function onRequestGet(context) {
  // console.log('=== context ===', context)
  // const { env } = context
  // console.log('=== env ===', env)
  const resBody = JSON.stringify({ message: `Hello World` }, null, 2)
  const response = new Response(resBody, { status: 200 })
  response.headers.set('Content-Type', 'application/json; charset=utf-8')
  return response
}
