const os = require('node:os')
const { debuglog } = require('node:util')
const { EMOJI, jsonSecret } = require('../utils.cjs')

const debug = debuglog('scripts:reddit:utils')

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

/**
 * The User-Agent for Reddit clients should be in the following format:
 * <platform>:<app ID>:<version string> (by /u/<reddit username>)
 *
 * https://github.com/reddit-archive/reddit/wiki/API
 */
const userAgent = ({ app_id, username, version = '0.1.0' }) => {
  return `${os.platform()}:${app_id}:v${version} (by /u/${username})`
}

const sendOutput = async (text) => {
  const { chat_id, token } = jsonSecret('telegram')

  const data = {
    chat_id,
    disable_notification: false,
    disable_web_page_preview: true,
    parse_mode: 'HTML',
    text
  }

  // console.log('body for Telegram sendMessage', data)

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-type': `application/json`
    }
  })

  debug(`Response status ${res.status}`)
  const res_body = await res.json()
  debug(`Response body %O`, res_body)
}

module.exports = {
  renderTelegramMessage,
  sendOutput,
  slugify,
  userAgent
}
