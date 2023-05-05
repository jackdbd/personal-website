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
  ad: 'reddit-website-audit.md',
  test: false
}

/**
 * Post my website audit ad to r/slavelabour or r/test.
 *
 * This script is meant to be used in a GitHub worklow, but can also be run locally.
 */
const submitRedditPost = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage(
      'Post ad for my website audit service to r/slavelabour or r/test.\nUsage: node scripts/reddit/$0'
    )
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
  const slug = slugify(title)

  const filepath = path.join('assets', 'ads', 'reddit-website-audit.md')
  let text = fs.readFileSync(filepath).toString()
  text = text.replace('CTA_PLACEHOLDER', argv['cta-md'])

  // in order to post to r/slavelabour, we need the appropriate flair
  // const flairs = await r.getSubreddit(subreddit).getLinkFlairTemplates()
  // const flair_template = await r.getSubreddit(subreddit).getUserFlair(username)

  let sub
  if (subreddit === 'test') {
    sub = await r.getSubreddit(subreddit).submitSelfpost({
      text,
      title
    })
  } else if (subreddit === 'slavelabour') {
    sub = await r.getSubreddit(subreddit).submitSelfpost({
      text,
      title,
      flairId: 'a2317922-8e2b-11e4-a65b-22000b358ccc'
    })
  } else {
    throw new Error(`subreddit ${subreddit} not supported by this script`)
  }

  const submission_name = sub.name.replaceAll('t3_', '')

  return {
    name: sub.name,
    subreddit,
    title,
    slug,
    text,
    url: `https://www.reddit.com/r/${subreddit}/comments/${submission_name}/${slug}/`,
    url_subreddit: `https://www.reddit.com/r/${subreddit}/`,
    user_agent
  }
}

submitRedditPost()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    console.error(err.message)
  })
