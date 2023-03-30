const fs = require('node:fs')
const path = require('node:path')
const snoowrap = require('snoowrap')
const yargs = require('yargs')
const {
  EMOJI,
  jsonSecret,
  sendOutput,
  slugify,
  renderTelegramMessage,
  userAgent
} = require('./utils.cjs')

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

const DEFAULT = {
  ad: 'reddit-website-audit.md',
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
      describe:
        'Call to action in markdown to inject into the ad (e.g. add a Stripe payment link)',
      demandOption: true
    })
    .option('test', {
      alias: 't',
      boolean: true,
      describe: 'Post the ad on r/test instead of r/slavelabour',
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

  const subreddit = argv.test ? 'test' : 'slavelabour'

  // title of the submission. up to 300 characters long
  const title = `[OFFER] I will audit your website for $60`
  // const slug = 'offer_i_will_audit_your_website'
  const slug = slugify(title)

  const filepath = path.join('assets', 'ads', 'reddit-website-audit.md')
  let text = fs.readFileSync(filepath).toString()
  text = text.replace('CTA_PLACEHOLDER', argv['cta-md'])

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
