import fs from 'node:fs'
import path from 'node:path'
import { debuglog } from 'node:util'
import { fileURLToPath } from 'node:url'
import PrettyError from 'pretty-error'
import snoowrap from 'snoowrap'
import yargs from 'yargs'
import { jsonSecret, sendOutput } from '../utilz.mjs'
import { slugify, renderTelegramMessage, userAgent } from './utils.mjs'

const pe = new PrettyError()

const debug = debuglog('reddit:post-ad-freelancing')

const __filename = fileURLToPath(import.meta.url)
const splits = __filename.split('/')
const APP_ID = splits[splits.length - 1]
const APP_VERSION = '0.1.0'

const me = JSON.parse(fs.readFileSync(path.join('assets', 'me.json')))

const DEFAULT = {
  'cta-md': me['cta-30min-consultation-md'],
  'rate-md': `**Rate:** ${me['hourly-rate-in-usd']} USD/hour. Open to flat-rate pricing for well-scoped projects.`,
  subreddit: 'test'
}

/**
 * Script that posts an ad on a single subreddit.
 *
 * This script is meant to be used in a GitHub worklow, but can also be run locally.
 */
const submitRedditPost = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage(
      'Post my freelancing ad on a single subreddit.\nUsage: node scripts/reddit/$0'
    )
    .option('cta-md', {
      default: DEFAULT['cta-md'],
      describe: 'Call to action in markdown'
    })
    .option('rate-md', {
      default: DEFAULT['rate-md'],
      describe: 'My freelance rate info in markdown'
    })
    .option('subreddit', {
      alias: 's',
      choices: ['forhire', 'jobbit', 'test'],
      default: DEFAULT.subreddit,
      demandOption: true,
      describe: 'Subreddit where to post the advertisement'
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

  debug(`initialize snoowrap with user agent ${user_agent}`)
  const r = new snoowrap({
    userAgent: user_agent,
    clientId: client_id,
    clientSecret: client_secret,
    username,
    password
  })

  const subreddit = argv.subreddit

  const filepath = path.join('assets', 'ads', 'reddit-freelancing.md')
  debug(`read ad from ${filepath}`)
  let text = fs.readFileSync(filepath).toString()
  text = text.replace('RATE_MARKDOWN_PLACEHOLDER', argv['rate-md'])
  text = text.replace('CTA_MARKDOWN_PLACEHOLDER', argv['cta-md'])

  const flairs = await r.getSubreddit(subreddit).getLinkFlairTemplates()
  // const flairs = await r.getSubreddit(subreddit).getUserFlairTemplates()
  debug(`flairs available in r/${subreddit}: ${flairs.join(', ')}`)

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

  debug(`will try posting "${title}" to r/${subreddit} (slug: ${slug})`)
  // throw new Error(`Aborted: ${title}`)

  // https://not-an-aardvark.github.io/snoowrap/Subreddit.html#selectMyFlair__anchor
  // https://not-an-aardvark.github.io/snoowrap/Subreddit.html#submitSelfpost__anchor
  const sub = await r
    .getSubreddit(subreddit)
    .selectMyFlair({ flair_template_id })
    .submitSelfpost({ text, title })

  // const sub = await r.getSubreddit(subreddit).submitSelfpost(post)
  debug(`Ad submitted on r/${subreddit}: ${title}`)

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
