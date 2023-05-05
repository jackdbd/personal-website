const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

// https://emojipedia.org/
const EMOJI = {
  ChartDecreasing: '📉',
  Coin: '🪙',
  CreditCard: '💳',
  Customer: '👤',
  DollarBanknote: '💵',
  Error: '🚨',
  Failure: '❌',
  Hook: '🪝',
  Inspect: '🔍',
  Invalid: '❌',
  MoneyBag: '💰',
  Notification: '💬',
  ShoppingBags: '🛍️',
  Ok: '✅',
  Robot: '🤖',
  Sparkles: '✨',
  Success: '✅',
  Timer: '⏱️',
  User: '👤',
  Warning: '⚠️'
}

const slugify = (title) => {
  return title
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replaceAll(' ', '_')
    .replaceAll('$', '')
    .toLowerCase()
}

const renderTelegramMessage = (d) => {
  let s = `<b>${EMOJI.Robot} Advertisement posted on r/${d.subreddit}</b>`
  s = s.concat('\n\n')
  s = s.concat(`<a href="${d.url}">submission ${d.name}</a>`)
  s = s.concat('\n\n')
  if (d.url_subreddit) {
    s = s.concat(`<a href="${d.url_subreddit}">subreddit r/${d.subreddit}</a>`)
    s = s.concat('\n\n')
  }
  s = s.concat(`<b>${d.title}</b>`)
  s = s.concat('\n\n')
  s = s.concat(`<pre>${d.text}</pre>`)
  s = s.concat('\n\n')
  s = s.concat(`<i>User-Agent: ${d.user_agent}</i>`)
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  s = s.concat('\n')
  return s
}

const sendOutput = async (text) => {
  if (process.env.GITHUB_SHA) {
    // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
    console.log(text)
  } else {
    const json_string = fs
      .readFileSync(path.join('secrets', 'telegram.json'))
      .toString()

    const { chat_id, token } = JSON.parse(json_string)

    const data = {
      chat_id,
      disable_notification: false,
      disable_web_page_preview: true,
      parse_mode: 'HTML',
      text
    }
    // console.log('body for Telegram sendMessage', data)

    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-type': `application/json`
        }
      }
    )

    console.log(`Response status ${res.status}`)
    const res_body = await res.json()
    console.log(`Response body`, res_body)
  }
}

/**
 * The User-Agent should be in the following format:
 * <platform>:<app ID>:<version string> (by /u/<reddit username>)
 *
 * https://github.com/reddit-archive/reddit/wiki/API
 */
const userAgent = ({ app_id, username, version = '0.1.0' }) => {
  return `${os.platform()}:${app_id}:v${version} (by /u/${username})`
}

const jsonSecret = (name) => {
  // replaceAll available in Node.js 15 and later
  // https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V15.md#v8-86---35415
  const env_var_name = name.replaceAll('-', '_').toUpperCase()

  let secret = ''
  if (process.env.GITHUB_SHA) {
    if (!process.env[env_var_name]) {
      throw new Error(`environment variable ${env_var_name} not set`)
    }
    secret = process.env[env_var_name]
  } else {
    secret = fs.readFileSync(path.join('secrets', `${name}.json`)).toString()
  }
  return JSON.parse(secret)
}

module.exports = {
  EMOJI,
  jsonSecret,
  renderTelegramMessage,
  sendOutput,
  slugify,
  userAgent
}
