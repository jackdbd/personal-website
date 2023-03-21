const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const snoowrap = require('snoowrap')
const { sendOutput, slugify, renderTelegramMessage } = require('./utils.cjs')

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

/**
 * Script to post an ad on Reddit.
 *
 *
 * This script is meant to be used in a GitHub worklow, but can also be run locally.
 *
 * Usage:
 * node scripts/reddit/post-ad-freelancing.cjs
 *
 * Rules of r/forhire.
 * https://www.reddit.com/r/forhire/comments/44aeko/rules_guidelines_read_before_posting/
 *
 */
const submitRedditPost = async () => {
  const subreddit = 'test'
  // const subreddit = 'forhire'
  // const subreddit = 'jobbit'

  // title of the submission. up to 300 characters long
  const title = `[For Hire] Full-stack developer & cloud consultant (GCP certified)`
  const slug = slugify(title)

  const filepath = path.join('assets', 'ads', 'reddit-freelancing.md')
  // body of the submission (raw markdown text)
  const text = fs.readFileSync(filepath).toString()

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

  const submission = await r.getSubreddit(subreddit).submitSelfpost({
    text,
    title
  })

  return {
    name: submission.name,
    subreddit,
    title,
    slug,
    text,
    url: `https://www.reddit.com/r/${subreddit}/comments/${submission.name}/${slug}/`
  }
}

submitRedditPost().then(renderTelegramMessage).then(sendOutput)
