const { sendEmail, sendMessageToTelegramChat } = require('../notifications.js')
const { ensureEnvVarsAreSet } = require('../utils.js')

// https://developers.cloudflare.com/pages/platform/functions/
export async function onRequestPost(context) {
  const { request, env, next, params, data } = context
  const url = new URL(request.url)
  const { origin, pathname } = url

  const requestPayload = await request.formData()

  // How do I see thin in the production logs? with `wrangler tail`?
  // https://developers.cloudflare.com/workers/wrangler/commands/#tail
  console.log('=== request payload contact form ===', requestPayload)

  const {
    email,
    message,
    name,
    ['ahah-gotcha-bot']: botField
  } = Object.fromEntries(requestPayload)

  if (botField) {
    // TODO: report the bot? Log something?
    const responsePayload = JSON.stringify(
      {
        message: `Sorry bot. I refuse to process your form submission.`
      },
      null,
      2
    )
    const response = new Response(responsePayload, { status: 403 })
    response.headers.set('Content-Type', 'application/json; charset=utf-8')
    return response
  }

  try {
    ensureEnvVarsAreSet(env, ['TELEGRAM'])
  } catch (err) {
    const sorry = name ? `Sorry ${name}!` : `Sorry!`
    const responsePayload = JSON.stringify(
      {
        errored: true,
        message: `${sorry} Your form submission could not be processed. Try contacting me in another way.`,
        errors: [err.message]
      },
      null,
      2
    )
    // TODO: send errors to Error Reporting
    const response = new Response(responsePayload, { status: 500 })
    response.headers.set('Content-Type', 'application/json; charset=utf-8')
    return response
  }

  const notification_channels = ['telegram']
  const failures = []
  const successes = []

  try {
    const telegram = JSON.parse(env.TELEGRAM)

    await sendMessageToTelegramChat({
      chat_id: telegram.chat_id,
      token: telegram.token,
      email,
      message,
      name
    })
    successes.push(`message sent to Telegram chat ${telegram.chat_id}`)
  } catch (err) {
    failures.push(err)
  }

  if (failures.length < notification_channels.length) {
    const warnings = failures.map((err) => err.message)

    // const response = await fetch(`${origin}/form-submission-succeeded/`, {
    //   method: 'GET'
    // })
    // const html = await response.text()

    // const res = new Response(html, { status: 200 })
    // res.headers.set('Content-Type', 'text/html; charset=UTF-8')

    return Response.redirect(`${origin}/form-submission-succeeded/`)
  } else {
    // const sorry = name ? `Sorry ${name}!` : `Sorry!`
    // const responsePayload = JSON.stringify(
    //   {
    //     errored: true,
    //     message: `${sorry} Your form submission could not be processed. Try contacting me in another way.`,
    //     errors: failures.map((err) => err.message)
    //   },
    //   null,
    //   2
    // )
    // // TODO: send errors to Error Reporting
    // const response = new Response(responsePayload, { status: 500 })
    // response.headers.set('Content-Type', 'application/json; charset=utf-8')
    // return response
    return Response.redirect(`${origin}/form-submission-failed/`)
  }
}
