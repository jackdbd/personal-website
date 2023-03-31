const PrettyError = require('pretty-error')
const snoowrap = require('snoowrap')
const yargs = require('yargs')
const { EMOJI, jsonSecret, sendOutput, userAgent } = require('./utils.cjs')

const pe = new PrettyError()

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

const KEYWORDS = [
  'performance audit',
  'site speed',
  'slow website',
  'web performance',
  'website performance',
  'website speed'
]

const SUBREDDITS = [
  'advancedentrepreneur',
  'analytics',
  // 'dropship',
  'GrowthHacking',
  'SaaS',
  // 'SEO',
  'smallbusiness',
  'webdev'
  // 'Wordpress'
]

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('node scripts/reddit/$0')
    .option('keywords', {
      alias: 'k',
      default: KEYWORDS.join(','),
      describe: 'keyword to search (comma-separated list)'
    })
    .option('subreddits', {
      alias: 's',
      default: SUBREDDITS.join(','),
      describe: 'subreddits where to run the search (comma-separated list)'
    })
    .help('help').argv

  const { username, password, client_id, client_secret } = jsonSecret('reddit')
  const user_agent = userAgent({ app_id, username, version: '0.1.0' })

  const r = new snoowrap({
    userAgent: user_agent,
    clientId: client_id,
    clientSecret: client_secret,
    username,
    password
  })

  const keywords = argv.keywords.split(',')
  const s = keywords.map((k) => `selftext:"${k}" OR title:"${k}"`).join(' OR ')
  const subreddits = argv.subreddits.split(',')
  const sr = subreddits.map((s) => `subreddit:${s}`).join(' OR ')

  const query = `
  self:true AND
  (${s}) AND
  (${sr})`

  if (query.length > 512) {
    throw new Error(
      `query is too long (${query.length} characters). Reddit /search supports only up to 512 characters: https://www.reddit.com/dev/api/#GET_search `
    )
  }

  // https://www.reddit.com/dev/api/#GET_search
  const submissions = await r.search({ query, time: 'month' })

  const subs = submissions.map((d) => {
    return {
      subreddit: d.subreddit.display_name,
      title: d.title,
      url: d.url
    }
  })
  // console.log(subs)
  return { query, submissions: subs, user_agent }
}

const renderTelegramMessage = (d) => {
  const links = d.submissions.map((s, i) => {
    return `${i + 1}. <a href="${s.url}">${s.title}</a>`
  })
  let s = `<b>${EMOJI.Robot} Reddit search</b>`
  s = s.concat('\n\n')
  s = s.concat(links.join('\n\n'))
  s = s.concat('\n\n')
  s = s.concat(`<i>Query</i>`)
  s = s.concat('\n')
  s = s.concat(`<pre><code>${d.query}</code></pre>`)
  s = s.concat('\n\n')
  s = s.concat(`<i>User-Agent: ${d.user_agent}</i>`)
  s = s.concat('\n')
  return s
}

main()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    console.log(pe.render(err))
  })
