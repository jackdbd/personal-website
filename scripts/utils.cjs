const fs = require('node:fs')
const path = require('node:path')
const { debuglog } = require('node:util')

const debug = debuglog('scripts:utils')

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

const waitMs = (ms) => {
  let timeout // NodeJS.Timeout
  return new Promise((resolve) => {
    timeout = setTimeout(() => {
      clearTimeout(timeout)
      resolve({ message: `timeout ${timeout} of ${ms}ms resolved` })
    }, ms)
  })
}

const jsonSecret = (name) => {
  // replaceAll available in Node.js 15 and later
  // https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V15.md#v8-86---35415
  const env_var_name = name.replaceAll('-', '_').toUpperCase()

  let secret = ''
  if (process.env[env_var_name]) {
    debug(`environment variable ${env_var_name} is set`)
    secret = process.env[env_var_name]
  } else {
    debug(`environment variable ${env_var_name} not set`)
    if (process.env.GITHUB_SHA) {
      throw new Error(`environment variable ${env_var_name} not set`)
    } else {
      const filepath = path.join('secrets', `${name}.json`)
      debug(`trying to read ${filepath}`)
      secret = fs.readFileSync(filepath).toString()
    }
  }

  return JSON.parse(secret)
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

    console.log(`[Telegram BOT API] response status ${res.status}`)
    const res_body = await res.json()
    console.log(`[Telegram BOT API] response body`, res_body)
  }
}

module.exports = { EMOJI, jsonSecret, sendOutput, waitMs }
