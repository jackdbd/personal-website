const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const slugify = (title) => {
  return title
    .replaceAll('[', '')
    .replaceAll(']', '')
    .replaceAll(' ', '_')
    .toLowerCase()
}

const renderTelegramMessage = (d) => {
  let s = `<b>🤖 Advertisement posted to r/${d.subreddit}</b>`
  s = s.concat('\n\n')
  s = s.concat(`<a href="${d.url}">submission ${d.name}</a>`)
  s = s.concat('\n\n')
  s = s.concat(`<b>${d.title}</b>`)
  s = s.concat('\n\n')
  s = s.concat(`<pre>${d.text}</pre>`)
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

module.exports = { renderTelegramMessage, sendOutput, slugify, userAgent }
