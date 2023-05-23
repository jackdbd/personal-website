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
    .usage('Post my freelancing ad on Reddit.\nUsage: node scripts/reddit/$0')
    .option('cta-md', {
      default:
        '**Free 30m consultation:** https://cal.com/giacomodebidda/30min',
      demandOption: false,
      describe: 'Call to action in markdown'
    })
    .option('rate-md', {
      demandOption: false,
      default:
        '**Rate:** 65 USD/hour. Open to flat-rate pricing for well-scoped projects.',
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

  const filepath = path.join('assets', 'ads', 'reddit-freelancing.md')
  let text = fs.readFileSync(filepath).toString()
  text = text.replace('RATE_MARKDOWN_PLACEHOLDER', argv['rate-md'])
  text = text.replace('CTA_MARKDOWN_PLACEHOLDER', argv['cta-md'])

  const flairs = await r.getSubreddit(subreddit).getLinkFlairTemplates()
  // const flairs = await r.getSubreddit(subreddit).getUserFlairTemplates()
  console.log(`flairs available in r/${subreddit}`, flairs)

  // title of the submission. up to 300 characters long
  let title
  // some subreddits require a flair to be set
  const flair_text = 'For Hire'
  let flair_template_id
  switch (subreddit) {
    case 'forhire':
      // FIXME: submissions on r/forhire stopped working. Myabe I should try a
      // different flair_template_id?
      const results = flairs.filter((d) => d.flair_text === flair_text)
      flair_template_id = results[0].flair_template_id
      title = `[${flair_text}] Full-stack developer & cloud consultant`
      break
    case 'jobbit':
      flair_template_id = results[0].flair_template_id
      title = `[${flair_text}] Full-stack developer & cloud consultant`
      break
    case 'test':
      flair_template_id = flairs[0].flair_template_id
      title = `[${flair_text}] Full-stack developer & cloud consultant`
      break
    default:
      throw new Error(`subreddit r/${subreddit} not handled`)
  }

  const slug = slugify(title)

  // throw new Error(`Aborted: ${title}`)

  // https://not-an-aardvark.github.io/snoowrap/Subreddit.html#selectMyFlair__anchor
  // https://not-an-aardvark.github.io/snoowrap/Subreddit.html#submitSelfpost__anchor
  const sub = await r
    .getSubreddit(subreddit)
    .selectMyFlair({ flair_template_id })
    .submitSelfpost({ text, title })

  // const sub = await r.getSubreddit(subreddit).submitSelfpost(post)
  console.log(`Ad submitted on r/${subreddit}: ${title}`)

  return {
    name: sub.name,
    subreddit,
    title,
    slug,
    text,
    url: `https://www.reddit.com/r/${subreddit}/comments/${sub.name}/${slug}/`,
    url_subreddit: `https://www.reddit.com/r/${subreddit}/`,
    user_agent
  }
}

submitRedditPost()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    console.log(pe.render(err))
  })
