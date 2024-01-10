const PrettyError = require('pretty-error')
const snoowrap = require('snoowrap')
const yargs = require('yargs')
const { EMOJI, jsonSecret, sendOutput } = require('../utils.cjs')
const { userAgent } = require('./utils.cjs')

const pe = new PrettyError()

const splits = __filename.split('/')
const APP_ID = splits[splits.length - 1]
const APP_VERSION = '0.1.0'

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
  // bunjs
  // 'dropship',
  'CloudFlare',
  // DevTo
  // frontend
  'GrowthHacking',
  'JAMstack',
  // javascript
  // node
  // 'OpenAssistant',
  // programming
  // reactjs
  'SaaS',
  // 'SEO',
  'smallbusiness',
  'WebDev'
  // Web_Performance
  // 'Wordpress'
]

const DEFAULT = {
  DESCRIPTION: 'Query description not provided',
  KEYWORDS,
  SUBREDDITS,
  TIME: 'week'
}

const searchOnReddit = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('node scripts/reddit/$0')
    .option('description', {
      alias: 'd',
      default: DEFAULT.DESCRIPTION,
      describe: 'human-friendly description of the provided query'
    })
    .option('keywords', {
      alias: 'k',
      default: DEFAULT.KEYWORDS.join(','),
      describe: 'keyword to search (comma-separated list)'
    })
    .option('query', {
      alias: 'q',
      demandOption: false,
      describe: 'query to use INSTEAD of keywords and subreddits'
    })
    .option('subreddits', {
      alias: 's',
      default: DEFAULT.SUBREDDITS.join(','),
      describe: 'subreddits where to run the search (comma-separated list)'
    })
    .option('time', {
      alias: 't',
      choices: ['hour', 'day', 'week', 'month', 'year', 'all'],
      default: DEFAULT.TIME,
      describe: 'timespan that posts should be retrieved from'
    })
    .help('help').argv

  const { username, password, client_id, client_secret } = jsonSecret({
    name: 'REDDIT',
    filepath: '/run/secrets/reddit/trusted_client'
  })

  const user_agent = userAgent({
    app_id: APP_ID,
    username,
    version: APP_VERSION
  })

  const r = new snoowrap({
    userAgent: user_agent,
    clientId: client_id,
    clientSecret: client_secret,
    username,
    password
  })

  let query = ''
  if (argv.query) {
    query = argv.query
  } else {
    const keywords = argv.keywords.split(',')
    const s = keywords
      .map((k) => `selftext:"${k}" OR title:"${k}"`)
      .join(' OR ')
    const subreddits = argv.subreddits.split(',')
    const sr = subreddits.map((s) => `subreddit:${s}`).join(' OR ')

    query = `self:true AND (${s}) AND (${sr})`
  }

  if (query.length > 512) {
    throw new Error(
      `query is too long (${query.length} characters). Reddit /search supports only up to 512 characters: https://www.reddit.com/dev/api/#GET_search `
    )
  }

  // https://www.reddit.com/dev/api/#GET_search
  // https://not-an-aardvark.github.io/snoowrap/Subreddit.html
  const submissions = await r.search({ query, time: argv.time })

  const subs = submissions.map((d) => {
    return {
      subreddit: d.subreddit.display_name,
      title: d.title,
      url: d.url
    }
  })
  // console.log(subs)
  return { description: argv.description, query, submissions: subs, user_agent }
}

const renderTelegramMessage = (d) => {
  const links = d.submissions.map((s, i) => {
    return `${i + 1}. <a href="${s.url}">${s.title}</a>`
  })
  let s = `<b>${EMOJI.Robot} Reddit search</b>`

  s = s.concat('\n\n')
  s = s.concat(`<b>Description</b>`)
  s = s.concat('\n')
  s = s.concat(`<pre>${d.description}</pre>`)

  s = s.concat('\n\n')
  s = s.concat(links.join('\n\n'))

  s = s.concat('\n\n')
  s = s.concat(`<b>Query</b>`)
  s = s.concat('\n')
  s = s.concat(`<pre><code>${d.query}</code></pre>`)

  s = s.concat('\n\n')
  s = s.concat(`<i>User-Agent: ${d.user_agent}</i>`)
  s = s.concat('\n')
  return s
}

searchOnReddit()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    console.log(pe.render(err))
  })
