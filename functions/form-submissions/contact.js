const ensureEnvVarsAreSet = (env, keys) => {
  for (const k of keys) {
    const json = env[k]
    if (!json) {
      throw new Error(`environment variable ${k} not set`)
    }
  }
}

const sendEmail = async ({ api_key, email, message, name }) => {
  const strings = [
    `New contact form submission from <b>${name}</b> (${email})`,
    message
  ]

  throw new Error(
    `sending email using the SendGrid API is not supported at the moment`
  )
}

const sendMessageToTelegramChat = async ({
  chat_id,
  email,
  message,
  name,
  token
}) => {
  const strings = [
    `New contact form submission from <b>${name}</b> (${email})`,
    message
  ]

  const body = {
    chat_id,
    disable_notification: false,
    disable_web_page_preview: true,
    parse_mode: 'HTML',
    text: strings.join('\n')
  }

  return fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: {
      'Content-type': `application/json`
    }
  })
}

// https://developers.cloudflare.com/workers/examples/return-html/
const successPage = ({ name, origin, successes, warnings }) => {
  const thanks = name ? `Thanks ${name}!` : `Thanks!`

  const strings = [
    `${thanks} Your form submission has been processed correctly.`,
    `I'll get back to you soon.`
  ]
  const info = strings.map((s) => `<p>${s}</p>`).join('')

  const ulSuccesses = `<ul>${successes.map((s) => `<li>${s}</li>`)}</ul>`
  const ulWarnings = `<ul>${warnings.map((s) => `<li>${s}</li>`)}</ul>`

  const homeHref = `${origin}/`
  const blogHref = `${origin}/blog/`
  // const blogHref = `https://www.giacomodebidda.com/blog/`

  const p = `<p>You can now go back to the <a href="${homeHref}">home</a>, or to the <a href="${blogHref}">blog</a>.</p>`

  const meta_tags = [
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1.0">`
  ]

  const head = `<head>${meta_tags.join('')}<title>Success page</title></head>`

  const body = `<body><h1>Success</h1>${info}${p}</body>`

  const html = `<!doctype html><html lang="en">${head}${body}</html>`
  const response = new Response(html, { status: 200 })
  response.headers.set('Content-Type', 'text/html; charset=UTF-8')
  return response
}

// https://developers.cloudflare.com/pages/platform/functions/
export async function onRequestPost(context) {
  const { request, env, params, data } = context
  const url = new URL(request.url)
  const { origin, pathname } = url

  const requestPayload = await request.formData()
  // console.log('=== requestPayload ===', requestPayload)

  const { email, message, name } = Object.fromEntries(requestPayload)

  try {
    ensureEnvVarsAreSet(env, ['SENDGRID', 'TELEGRAM'])
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

  const notification_channels = ['sendgrid', 'telegram']
  const failures = []
  const successes = []

  try {
    const sendgrid = JSON.parse(env.SENDGRID)

    await sendEmail({
      api_key: sendgrid.api_key,
      email,
      message,
      name
    })
    successes.push(`message sent to SendGrid`)
  } catch (err) {
    failures.push(err)
  }

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
    // const thanks = name ? `Thanks ${name}!` : `Thanks!`
    // const responsePayload = JSON.stringify(
    //   {
    //     message: `${thanks} Your form submission was handled correctly. I'll get back to you soon.`,
    //     successes,
    //     warnings: failures.map((err) => err.message)
    //   },
    //   null,
    //   2
    // )
    // const response = new Response(responsePayload, { status: 200 })
    // response.headers.set('Content-Type', 'application/json; charset=utf-8')
    // return response
    return successPage({ name, origin, successes, warnings })
  } else {
    const sorry = name ? `Sorry ${name}!` : `Sorry!`
    const responsePayload = JSON.stringify(
      {
        errored: true,
        message: `${sorry} Your form submission could not be processed. Try contacting me in another way.`,
        errors: failures.map((err) => err.message)
      },
      null,
      2
    )
    // TODO: send errors to Error Reporting
    const response = new Response(responsePayload, { status: 500 })
    response.headers.set('Content-Type', 'application/json; charset=utf-8')
    return response
  }
}
