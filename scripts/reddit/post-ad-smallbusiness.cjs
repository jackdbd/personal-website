const fs = require('node:fs')
const path = require('node:path')
const snoowrap = require('snoowrap')
const { sendOutput, userAgent } = require('./utils.cjs')

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

const main = async () => {
  const subreddit = 'test'
  //   const subreddit = 'smallbusiness'

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

  const user_agent = userAgent({ app_id, username, version: '0.1.0' })

  const r = new snoowrap({
    userAgent: user_agent,
    clientId: client_id,
    clientSecret: client_secret,
    username,
    password
  })

  const query = `
  self:true AND 
  title:"Promote your business" AND 
  subreddit:${subreddit}`

  // https://www.reddit.com/dev/api/#GET_search
  const submissions = await r.search({
    limit: 1,
    query,
    sort: 'new',
    time: 'month'
  })

  if (subreddit === 'test' && submissions.length === 0) {
    await r.getSubreddit(subreddit).submitSelfpost({
      text: 'This is **some bold text** and this a [link](https://google.com)',
      title: 'Promote your business'
    })
    throw new Error(
      `No submissions found in r/${subreddit}. Created a new one. Wait a couple of minutes to give Reddit the time to update its search API, then rerun this script.`
    )
  }

  const sub = submissions[0]

  const filepath = path.join('assets', 'ads', 'reddit-smallbusiness.md')
  const text = fs.readFileSync(filepath).toString()

  // https://not-an-aardvark.github.io/snoowrap/Submission.html#reply__anchor
  const comment = await r.getSubmission(sub.id).reply(text)
  console.log(`created comment ${comment.id} in submission ${sub.id}`)

  const comment_url = `https://www.reddit.com/r/${subreddit}/comments/${sub.id}/comment/${comment.id}/`

  await r.getSubmission(sub.id).upvote()
  console.log(`upvoted submission ${sub.id}`)

  return {
    comment_url,
    submission_title: sub.title,
    submission_url: sub.url,
    subreddit,
    text
  }
}

const renderTelegramMessage = (d) => {
  let s = `<b>🤖 Advertisement posted to r/${d.subreddit}</b>`
  s = s.concat('\n\n')
  s = s.concat(
    `<a href="${d.comment_url}">my comment to submission "${d.submission_title}"</a>`
  )
  s = s.concat('\n\n')
  s = s.concat(`<pre>${d.text}</pre>`)
  s = s.concat('\n')
  return s
}

main().then(renderTelegramMessage).then(sendOutput)
