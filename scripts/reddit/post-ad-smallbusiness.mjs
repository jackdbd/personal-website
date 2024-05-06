import fs from 'node:fs'
import path from 'node:path'
import defDebug from 'debug'
import { fileURLToPath } from 'node:url'
import snoowrap from 'snoowrap'
import yargs from 'yargs'
import {
  defRenderTelegramErrorMessage,
  EMOJI,
  jsonSecret,
  sendOutput
} from '../utils.mjs'
import { userAgent } from './utils.mjs'

const debug = defDebug('reddit:post-ad-smallbusiness')

const __filename = fileURLToPath(import.meta.url)
const splits = __filename.split('/')
const app_id = splits[splits.length - 1]
const app_version = '0.1.0'

const DEFAULT = {
  ad: 'reddit-smallbusiness.md',
  test: false
}

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} Post ad on r/test or r/smallbusiness</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`
})

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
    app_id,
    username,
    version: app_version
  })

  debug(`initialize snoowrap with user agent ${user_agent}`)
  const r = new snoowrap({
    userAgent: user_agent,
    clientId: client_id,
    clientSecret: client_secret,
    username,
    password
  })

  const subreddit = argv.test ? 'test' : 'smallbusiness'

  const title = 'Promote your business'
  // throw new Error(`Aborted: ${title}`)

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
    sendOutput(renderTelegramErrorMessage(err))
  })
