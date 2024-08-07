import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defDebug from 'debug'
import { isOnGithub } from '@jackdbd/checks/environment'

const debug = defDebug('script:utils')

const __filename = fileURLToPath(import.meta.url)
export const REPO_ROOT = path.join(__filename, '..', '..')
export const SECRETS_ROOT = path.join(REPO_ROOT, 'secrets')

export const defRenderTelegramErrorMessage = (
  config = { header: 'Header', footer: 'Footer' }
) => {
  debug(`define renderTelegramErrorMessage using this config %O`, config)
  const { header, footer } = config

  return (err: any) => {
    debug(`render Telegram error message`)
    let s = header

    s = `${s}\n\n<b>${err.name || 'Error'}</b>`
    s = `${s}\n<pre>${err.message}</pre>`

    return `${s}\n\n${footer}\n`
  }
}

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

interface SecretConfig {
  name: string
  filepath: string
}

export const jsonSecret = ({ name, filepath }: SecretConfig) => {
  if (process.env.CF_PAGES || process.env.GITHUB_SHA) {
    if (!name) {
      throw new Error(`secret name not set`)
    }
    // replaceAll available in Node.js 15 and later
    // https://github.com/nodejs/node/blob/master/doc/changelogs/CHANGELOG_V15.md#v8-86---35415
    const env_var_name = (name as any).replaceAll('-', '_').toUpperCase()
    if (!process.env[env_var_name]) {
      throw new Error(`environment variable ${env_var_name} not set`)
    }
    debug(`read JSON secret from environment variable ${env_var_name}`)
    return JSON.parse(process.env[env_var_name]!)
  }

  if (!filepath) {
    throw new Error(`secret filepath not set`)
  }
  debug(`read JSON secret from ${filepath}`)
  return JSON.parse(fs.readFileSync(filepath).toString())
}

export const txtSecret = (name: string, env = process.env) => {
  const env_var_name = (name as any).replaceAll('-', '_').toUpperCase()

  let txt: string
  if (isOnGithub(env)) {
    txt = env[env_var_name]!
  } else {
    const filepath = path.join('secrets', `${name}.txt`)
    txt = fs.readFileSync(filepath).toString()
  }
  return txt
}

export const sendOutput = async (text: string) => {
  if (process.env.GITHUB_SHA) {
    // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
    console.log(text)
  } else {
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

    debug(`Response status ${res.status}`)
    const res_body = await res.json()
    debug(`Response body %O`, res_body)
  }
}

/**
 * Generic User-Agent that follows this format:
 * <platform>:<app ID>:<version string>
 *
 * https://github.com/reddit-archive/reddit/wiki/API
 */
export const userAgent = ({ app_id, version = '0.1.0' }) => {
  return `${os.platform()}:${app_id}:v${version}`
}
