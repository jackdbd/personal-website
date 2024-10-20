import fs from "node:fs";
import path from "node:path";
// const FormData = require('form-data')
import { chromium } from "playwright-core";
// const snoowrap = require('snoowrap')

// const splits = __filename.split('/')
// const app_id = splits[splits.length - 1]

// TODO: decide what to do with this script. Finish implementing it or delete it.

/**
 * Usage:
 * node scripts/reddit/reddit-playwright.mjs
 */
const main = async () => {
  //   const args = process.argv.slice(2)
  // const subreddit = 'test'

  // const { username, password, client_id, client_secret } = jsonSecret({
  //   name: 'REDDIT',
  //   filepath: '/run/secrets/reddit/trusted_client'
  // })

  // const user_agent = userAgent({ app_id, username, version: '0.1.0' })

  // const r = new snoowrap({
  //   userAgent: user_agent,
  //   clientId: client_id,
  //   clientSecret: client_secret,
  //   username,
  //   password
  // })

  //   const query = `
  //   self:true AND
  //   (selftext:"test" OR title:"test") AND
  //   subreddit:${subreddit}`

  // const query = `self:true AND (selftext:"test" OR title:"test")`

  // const submissions = await r.search({
  //   limit: 1,
  //   query,
  //   sort: 'new',
  //   time: 'month'
  // })

  // if (submissions.length === 0) {
  //   throw new Error(
  //     `No submissions matching query "${query}" found in r/${subreddit}`
  //   )
  // }

  // const sub = submissions[0]

  // https://giacomodebidda.com/posts/playwright-on-nixos/
  // When running on:
  // - GitHub Actions => use the chromium revision bundled with Playwright.
  // - my NixOS laptop => use the chromium revision installed with Home Manager.
  const browser = await chromium.launch({
    devtools: process.env.GITHUB_SHA ? false : true,
    executablePath: process.env.GITHUB_SHA
      ? undefined
      : process.env.CHROMIUM_PATH,
    headless: process.env.GITHUB_SHA ? true : false,
  });

  const ctx = await browser.newContext();

  // const eu_cookie = encodeURIComponent(
  //   JSON.stringify({ opted: true, nonessential: false })
  // )

  // set eu_cookie to bypass the consent banner
  // await ctx.addCookies([
  //   {
  //     name: 'eu_cookie',
  //     value: eu_cookie,
  //     domain: '.reddit.com',
  //     path: '/'
  //   }
  // ])

  const page = await ctx.newPage();
  await page.goto("https://www.reddit.com/r/NixOS/");

  // await page.goto(sub.url)

  // TODO: login, otherwise Reddit MIGHT display a dialog asking us if we are
  // over 18 (e.g. when an image is NSFW or SEEMS NSFW because it contains a lot
  // of pink)
  // navigate to login page
  //   await page.locator(`a[role="button"]`).click()

  // not working...
  //   await page.locator(`#loginUsername`).fill(username)
  //   await page.locator(`#loginPassword`).focus()

  // await waitMs(5000)

  // const image_path = `reddit-submission-${sub.id}.png`
  // await page.screenshot({ path: image_path })

  await browser.close();

  // const { chat_id, token } = jsonSecret({
  //   name: 'TELEGRAM',
  //   filepath: '/run/secrets/telegram/personal_bot'
  // })

  // FormData is available in Node.js 18 and later, but it doesn't seem to work here
  // const data = new FormData()
  // data.append('caption', `screenshot of Reddit submission ${sub.id}`)
  // data.append('chat_id', chat_id)
  // data.append('photo', fs.createReadStream(image_path))

  // 'Content-type': 'multipart/form-data'
  // const config = {
  //   url: `https://api.telegram.org/bot${token}/sendPhoto`,
  //   data,
  //   maxBodyLength: Infinity,
  //   method: 'POST',
  //   headers: {
  //     ...data.getHeaders()
  //   }
  // }

  // const res = await axios.request(config)

  //   fs.unlinkSync(image_path)

  // fetch is available in Node.js 18 and later, but it doesn't seem to work here
  //  https://core.telegram.org/bots/api#sendphoto
  //   const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
  //     method: 'POST',
  //     body: data,
  //     headers: { ...data.getHeaders() }
  //   })

  // return res.data
};

main();
// .then(console.log)
// .catch((err) => {
//   console.error(`=== ERROR ===`, err)
//   process.exit(1)
// })
