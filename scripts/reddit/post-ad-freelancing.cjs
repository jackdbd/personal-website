const fs = require('node:fs')
const path = require('node:path')
const snoowrap = require('snoowrap')
const yargs = require('yargs')
const {
  jsonSecret,
  sendOutput,
  slugify,
  renderTelegramMessage,
  userAgent
} = require('./utils.cjs')

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

const DEFAULT = {
  ad: 'reddit-freelancing.md',
  'cta-md': '**Free 30m consultation:** https://cal.com/giacomodebidda/30min',
  'rate-md':
    '**Rate:** €400/day. Open to flat-rate pricing for well-scoped projects.',
  test: false
}

/**
 * Script that posts an ad on Reddit.
 *
 * This script is meant to be used in a GitHub worklow, but can also be run locally.
 */
const submitRedditPost = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('node scripts/reddit/$0')
    .option('ad', {
      describe: 'Text to post',
      demandOption: false
    })
    .option('cta-md', {
      describe: 'Call to action in markdown',
      demandOption: false
    })
    .option('rate-md', {
      describe: 'My freelance rate info in markdown',
      demandOption: false
    })
    .option('test', {
      alias: 't',
      boolean: true,
      describe: 'Post the ad on r/test instead of r/ForHire',
      demandOption: false
    })
    .help('help')
    .default(DEFAULT).argv

  const { username, password, client_id, client_secret } = jsonSecret('reddit')
  const user_agent = userAgent({ app_id, username, version: '0.1.0' })

  const r = new snoowrap({
    userAgent: user_agent,
    clientId: client_id,
    clientSecret: client_secret,
    username,
    password
  })

  const subreddit = argv.test ? 'test' : 'forhire'
  // const subreddit = 'forhire'
  // const subreddit = 'jobbit'

  // title of the submission. up to 300 characters long
  const title = `[For Hire] Full-stack developer & cloud consultant (GCP certified)`
  const slug = slugify(title)

  const filepath = path.join('assets', 'ads', argv.ad)
  let text = fs.readFileSync(filepath).toString()
  text = text.replace('RATE_MARKDOWN_PLACEHOLDER', argv['rate-md'])
  text = text.replace('CTA_MARKDOWN_PLACEHOLDER', argv['cta-md'])

  const sub = await r.getSubreddit(subreddit).submitSelfpost({
    text,
    title
  })

  return {
    name: sub.name,
    subreddit,
    title,
    slug,
    text,
    url: `https://www.reddit.com/r/${subreddit}/comments/${sub.name}/${slug}/`,
    user_agent
  }
}

submitRedditPost().then(renderTelegramMessage).then(sendOutput)
