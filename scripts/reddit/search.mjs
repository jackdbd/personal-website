import { fileURLToPath } from 'node:url'
import { debuglog } from 'node:util'
import yargs from 'yargs'
import { defRenderTelegramErrorMessage, EMOJI, sendOutput } from '../utils.mjs'
import { defSnoowrap } from './utils.mjs'

const debug = debuglog('reddit:search')

const __filename = fileURLToPath(import.meta.url)
const splits = __filename.split('/')
const app_id = splits[splits.length - 1]
const app_version = '0.1.0'

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} Search Reddit</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`
})

const KEYWORDS = [
  'performance audit',
  'site speed',
  'slow website',
  'web performance',
  // 'website performance',
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

  const r = defSnoowrap({ app_id, app_version })

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

  // throw new Error(`Aborted: Reddit search`)

  // https://www.reddit.com/dev/api/#GET_search
  // https://not-an-aardvark.github.io/snoowrap/Subreddit.html
  const submissions = await r.search({ query, time: argv.time })
  debug(`${submissions.length} submissions matching this query\n${query}`)

  const subs = submissions.map((d) => {
    return {
      subreddit: d.subreddit.display_name,
      title: d.title,
      url: d.url
    }
  })
  // console.log(subs)
  return {
    description: argv.description,
    query,
    submissions: subs,
    app_id,
    app_version
  }
}

const renderTelegramMessage = (d) => {
  const links = d.submissions.map((s, i) => {
    return `${i + 1}. <a href="${s.url}">${s.title}</a>`
  })
  let s = `<b>${EMOJI.Robot} Reddit search</b>`

  s = `${s}\n\n<b>Description</b>\n`
  s = s.concat(`<pre>${d.description}</pre>`)

  s = `${s}\n\n<b>Results</b>\n`
  if (links.length === 0) {
    s = `${s}The query returned no results.`
  } else {
    s = s.concat(links.join('\n\n'))
  }

  s = `${s}\n\n<b>Query</b>\n`
  s = s.concat(`<pre><code>${d.query}</code></pre>`)

  s = s.concat('\n\n')
  s = s.concat(`<i>Message sent by: ${app_id} (vers. ${app_version})</i>`)
  s = s.concat('\n')
  return s
}

searchOnReddit()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => renderTelegramErrorMessage(err).then(sendOutput))
