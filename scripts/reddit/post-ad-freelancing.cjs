const fs = require('node:fs')
const path = require('node:path')
const PrettyError = require('pretty-error')
const snoowrap = require('snoowrap')
const yargs = require('yargs')
const {
  jsonSecret,
  sendOutput,
  slugify,
  renderTelegramMessage,
  userAgent
} = require('./utils.cjs')

const pe = new PrettyError()

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

/**
 * Script that posts an ad on Reddit.
 *
 * This script is meant to be used in a GitHub worklow, but can also be run locally.
 */
const submitRedditPost = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('node scripts/reddit/$0')
    .option('cta-md', {
      default:
        '**Free 30m consultation:** https://cal.com/giacomodebidda/30min',
      demandOption: false,
      describe: 'Call to action in markdown'
    })
    .option('rate-md', {
      demandOption: false,
      default:
        '**Rate:** €400/day. Open to flat-rate pricing for well-scoped projects.',
      describe: 'My freelance rate info in markdown'
    })
    .option('subreddit', {
      alias: 's',
      choices: ['forhire', 'jobbit', 'test'],
      default: 'test',
      demandOption: true,
      describe: 'Subreddit where to post the advertisement'
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

  const subreddit = argv.subreddit

  // title of the submission. up to 300 characters long
  const title = `[For Hire] Full-stack developer & cloud consultant (GCP certified)`
  const slug = slugify(title)

  const filepath = path.join('assets', 'ads', 'reddit-freelancing.md')
  let text = fs.readFileSync(filepath).toString()
  text = text.replace('RATE_MARKDOWN_PLACEHOLDER', argv['rate-md'])
  text = text.replace('CTA_MARKDOWN_PLACEHOLDER', argv['cta-md'])

  const flairs = await r.getSubreddit(subreddit).getLinkFlairTemplates()
  console.log(`flairs available in r/${subreddit}`, flairs)

  let flairId
  switch (subreddit) {
    case 'forhire':
      flairId = '530dbcf8-6582-11e2-ab2f-12313d051e91'
      break
    case 'jobbit':
      flairId = '09fd86a6-7815-11e2-bb33-12313d166255'
      break
    case 'test':
      flairId = '6b39b4a6-be2f-11e8-ac14-0e2593696d0a'
      break
    default:
      throw new Error(`subreddit r/${subreddit} not handled`)
  }

  const sub = await r.getSubreddit(subreddit).submitSelfpost({
    text,
    title,
    flairId
  })
  console.log(`Ad submitted on r/${subreddit}: ${title}`)

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

submitRedditPost()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    console.log(pe.render(err))
  })
