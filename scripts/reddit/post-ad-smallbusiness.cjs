const fs = require('node:fs')
const path = require('node:path')
const snoowrap = require('snoowrap')
const yargs = require('yargs')
const { EMOJI, jsonSecret, sendOutput } = require('../utils.cjs')
const { userAgent } = require('./utils.cjs')

const splits = __filename.split('/')
const APP_ID = splits[splits.length - 1]
const APP_VERSION = '0.1.0'

const DEFAULT = {
  ad: 'reddit-smallbusiness.md',
  test: false
}

const submitRedditPost = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage(
      'Post ad for my website audit service to r/smallbusiness or r/test.\nUsage: node scripts/reddit/$0'
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
      describe: 'Post the ad on r/test instead of r/smallbusiness',
      demandOption: false
    })
    .help('help')
    .default(DEFAULT).argv

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

  const subreddit = argv.test ? 'test' : 'smallbusiness'

  const title = 'Promote your business'

  // self:true AND
  const query = `subreddit:${subreddit} AND title:"${title}"`

  // https://www.reddit.com/dev/api/#GET_search
  const submissions = await r.search({
    limit: 1,
    query,
    sort: 'new',
    time: 'month'
  })

  if (subreddit === 'test' && submissions.length === 0) {
    const sub = await r.getSubreddit(subreddit).submitSelfpost({
      text: 'This is **some bold text** and this a [link](https://google.com).',
      title
    })
    const details = [
      `No submissions found in r/${subreddit}.`,
      `Created new submission ${sub.name}.`,
      `Wait a couple of minutes to give Reddit the time to update its search API, then rerun this script.`
    ]
    throw new Error(details.join(' '))
  }

  const filepath = path.join('assets', 'ads', argv.ad)
  let text = fs.readFileSync(filepath).toString()
  text = text.replace('CTA_PLACEHOLDER', argv['cta-md'])

  const sub = submissions[0]

  // https://not-an-aardvark.github.io/snoowrap/Submission.html#reply__anchor
  const comment = await r.getSubmission(sub.id).reply(text)
  const comment_url = `https://www.reddit.com/r/${subreddit}/comments/${sub.id}/comment/${comment.id}/`

  console.log(`Posted ad on r/${subreddit}`, {
    ad: filepath,
    comment_id: comment.id,
    comment_url,
    submission_id: sub.id
  })

  // await r.getSubmission(sub.id).upvote()
  // console.log(`upvoted submission ${sub.id}`)

  return {
    ad: filepath,
    comment_url,
    submission_title: sub.title,
    submission_url: sub.url,
    subreddit,
    text,
    url_subreddit: `https://www.reddit.com/r/${subreddit}/`,
    user_agent
  }
}

const renderTelegramMessage = (d) => {
  let s = `<b>${EMOJI.Robot} Advertisement posted on r/${d.subreddit}</b>`
  s = s.concat('\n\n')
  if (d.url_subreddit) {
    s = s.concat(`<a href="${d.url_subreddit}">subreddit r/${d.subreddit}</a>`)
    s = s.concat('\n\n')
  }
  s = s.concat(
    `The text content of <code>${d.ad}</code> was posted as a comment of the submission <a href="${d.comment_url}">${d.submission_title}</a>.`
  )
  s = s.concat('\n')
  s = s.concat(`Here is what was posted to r/${d.subreddit}.`)
  s = s.concat('\n\n')
  s = s.concat(`<pre>${d.text}</pre>`)
  s = s.concat('\n\n')
  s = s.concat(`<i>User-Agent: ${d.user_agent}</i>`)
  s = s.concat('\n')
  return s
}

submitRedditPost()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    console.error(err.message)
  })
