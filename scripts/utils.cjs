const fs = require('node:fs')
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

const waitMs = (ms) => {
  let timeout // NodeJS.Timeout
  return new Promise((resolve) => {
    timeout = setTimeout(() => {
      clearTimeout(timeout)
      resolve({ message: `timeout ${timeout} of ${ms}ms resolved` })
    }, ms)
  })
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

const jsonSecret = ({ name, filepath }) => {
  if (process.env.CF_PAGES || process.env.GITHUB_SHA) {
    if (!name) {
      throw new Error(`secret name not set`)
    }
    const env_var_name = name.replaceAll('-', '_').toUpperCase()
    if (!process.env[env_var_name]) {
      throw new Error(`environment variable ${env_var_name} not set`)
    }
    return JSON.parse(process.env[env_var_name])
  }

  if (!filepath) {
    throw new Error(`secret filepath not set`)
  }
  return JSON.parse(fs.readFileSync(filepath).toString())
}

module.exports = { EMOJI, jsonSecret, sendOutput, waitMs }
