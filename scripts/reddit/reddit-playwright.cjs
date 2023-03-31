const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const axios = require('axios')
const FormData = require('form-data')
const { chromium } = require('playwright')
const snoowrap = require('snoowrap')
const { sendOutput, userAgent } = require('./utils.cjs')

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

const waitMs = (ms) => {
  let timeout // NodeJS.Timeout
  return new Promise((resolve) => {
    timeout = setTimeout(() => {
      clearTimeout(timeout)
      resolve({ message: `timeout ${timeout} of ${ms}ms resolved` })
    }, ms)
  })
}

/**
 * Usage:
 * node scripts/reddit/reddit-playwright.cjs
 */
const main = async () => {
  //   const args = process.argv.slice(2)
  const subreddit = 'test'

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

  //   const query = `
  //   self:true AND
  //   (selftext:"test" OR title:"test") AND
  //   subreddit:${subreddit}`

  const query = `
  self:true AND 
  (selftext:"test" OR title:"test")`

  const submissions = await r.search({
    limit: 1,
    query,
    sort: 'new',
    time: 'month'
  })

  if (submissions.length === 0) {
    throw new Error(
      `No submissions matching query "${query}" found in r/${subreddit}`
    )
  }

  const sub = submissions[0]

  const browser = await chromium.launch({
    // devtools: process.env.GITHUB_SHA ? false : true,
    headless: process.env.GITHUB_SHA ? true : false
  })

  const ctx = await browser.newContext()

  const eu_cookie = encodeURIComponent(
    JSON.stringify({ opted: true, nonessential: false })
  )

  // set eu_cookie to bypass the consent banner
  await ctx.addCookies([
    {
      name: 'eu_cookie',
      value: eu_cookie,
      domain: '.reddit.com',
      path: '/'
    }
  ])

  const page = await ctx.newPage()

  await page.goto(sub.url)

  // TODO: login, otherwise Reddit MIGHT display a dialog asking us if we are
  // over 18 (e.g. when an image is NSFW or SEEMS NSFW because it contains a lot
  // of pink)
  // navigate to login page
  //   await page.locator(`a[role="button"]`).click()

  // not working...
  //   await page.locator(`#loginUsername`).fill(username)
  //   await page.locator(`#loginPassword`).focus()

  //   await waitMs(1000)

  const image_path = `reddit-submission-${sub.id}.png`
  await page.screenshot({ path: image_path })

  await browser.close()

  let telegram_json_string
  if (process.env.TELEGRAM) {
    telegram_json_string = process.env.TELEGRAM
  } else {
    telegram_json_string = fs
      .readFileSync(path.join('secrets', 'telegram.json'))
      .toString()
  }
  const { chat_id, token } = JSON.parse(telegram_json_string)

  // FormData is available in Node.js 18 and later, but it doesn't seem to work here
  const data = new FormData()
  data.append('caption', `screenshot of Reddit submission ${sub.id}`)
  data.append('chat_id', chat_id)
  data.append('photo', fs.createReadStream(image_path))

  // 'Content-type': 'multipart/form-data'
  const config = {
    url: `https://api.telegram.org/bot${token}/sendPhoto`,
    data,
    maxBodyLength: Infinity,
    method: 'POST',
    headers: {
      ...data.getHeaders()
    }
  }

  const res = await axios.request(config)

  //   fs.unlinkSync(image_path)

  // fetch is available in Node.js 18 and later, but it doesn't seem to work here
  //  https://core.telegram.org/bots/api#sendphoto
  //   const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
  //     method: 'POST',
  //     body: data,
  //     headers: { ...data.getHeaders() }
  //   })

  return res.data
}

main()
  .then(console.log)
  .catch((err) => {
    console.error(`=== ERROR ===`, err)
    process.exit(1)
  })
