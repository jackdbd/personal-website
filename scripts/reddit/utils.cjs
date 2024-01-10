const os = require('node:os')

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

module.exports = {
  renderTelegramMessage,
  slugify,
  userAgent
}
