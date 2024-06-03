import fs from 'node:fs'
import defDebug from 'debug'

const debug = defDebug('script:utils')

// https://emojipedia.org/
export const EMOJI = {
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

export const waitMs = (ms) => {
  let timeout // NodeJS.Timeout
  return new Promise((resolve) => {
    timeout = setTimeout(() => {
      clearTimeout(timeout)
      resolve({ message: `timeout ${timeout} of ${ms}ms resolved` })
    }, ms)
  })
}

export const jsonSecret = ({ name, filepath }) => {
  if (process.env.CF_PAGES || process.env.GITHUB_SHA) {
    if (!name) {
      throw new Error(`secret name not set`)
    }
    const env_var_name = name.replaceAll('-', '_').toUpperCase()
    if (!process.env[env_var_name]) {
      throw new Error(`environment variable ${env_var_name} not set`)
    }
    debug(`read JSON secret from environment variable ${env_var_name}`)
    return JSON.parse(process.env[env_var_name])
  }

  if (!filepath) {
    throw new Error(`secret filepath not set`)
  }
  debug(`read JSON secret from ${filepath}`)
  return JSON.parse(fs.readFileSync(filepath).toString())
}

export const sendOutput = async (text) => {
  const { chat_id, token } = jsonSecret({
    name: 'TELEGRAM',
    filepath: '/run/secrets/telegram/personal_bot'
  })

  const data = {
    chat_id,
    disable_notification: false,
    disable_web_page_preview: true,
    parse_mode: 'HTML',
    text
  }

  debug(`send message to Telegram chat ID ${chat_id}`)
  // debug('body for Telegram sendMessage %O', data)

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-type': `application/json`
    }
  })

  debug(`[Telegram BOT API] response status ${res.status}`)
  const res_body = await res.json()
  let username = res_body.result.from.username
  debug(`[Telegram BOT API] response sent from ${username}`)
}

export const defRenderTelegramErrorMessage = (
  config = { header: 'Header', footer: 'Footer' }
) => {
  debug(`define renderTelegramErrorMessage using this config %O`, config)
  const { header, footer } = config

  return (err) => {
    debug(`render Telegram error message`)
    let s = header

    s = `${s}\n\n<b>${err.name || 'Error'}</b>`
    s = `${s}\n<pre>${err.message}</pre>`

    return `${s}\n\n${footer}\n`
  }
}

// Running the Steampipe binary on NixOS is a bit of a mess, so on NixOS we run
// it in a Docker container as a workaround.
// https://github.com/NixOS/nixpkgs/issues/215945
export const steampipe =
  process.env.HOME === '/home/jack'
    ? [
        `docker run --rm`,
        `--mount $"type=bind,source=/home/jack/steampipe/config,target=/home/steampipe/.steampipe/config"`,
        `--name steampipe`,
        `turbot/steampipe:latest`
      ].join(' ')
    : 'steampipe'
