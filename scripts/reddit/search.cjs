const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const snoowrap = require('snoowrap')

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

const main = async () => {
  let secret = ''
  if (process.env.GITHUB_SHA) {
    if (!process.env.REDDIT) {
      throw new Error(`environment variable REDDIT not set`)
    }
    secret = process.env.REDDIT
  } else {
    secret = fs.readFileSync(path.join('secrets', 'reddit.json')).toString()
  }
  const { username, password, client_id, client_secret } = JSON.parse(secret)

  // The User-Agent should be in the following format:
  // <platform>:<app ID>:<version string> (by /u/<reddit username>)
  // https://github.com/reddit-archive/reddit/wiki/API
  const user_agent = `${os.platform()}:${app_id}:v0.1.0 (by /u/${username})`

  const r = new snoowrap({
    userAgent: user_agent,
    clientId: client_id,
    clientSecret: client_secret,
    username,
    password
  })

  const keywords = [
    'performance audit',
    'site speed',
    'slow website',
    'web performance',
    'website performance',
    'website speed'
  ]
  // const keywords = ['freelance', 'freelancer', 'freelancing']
  const s = keywords.map((k) => `selftext:"${k}" OR title:"${k}"`).join(' OR ')

  const subreddits = [
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
  console.log(subs)
}

main()
