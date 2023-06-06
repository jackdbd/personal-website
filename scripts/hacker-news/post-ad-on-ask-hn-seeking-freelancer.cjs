const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
const { EMOJI, waitMs, sendOutput } = require('../utils.cjs')

const splits = __filename.split('/')
const APP_ID = splits[splits.length - 1]

const renderTelegramSuccessMessage = (d) => {
  let s = `<b>${EMOJI.Robot} ASK HN: Freelancer? Looking for work?</b>`

  s = s.concat('\n\n')
  s = s.concat(
    `This ad was posted on <a href="${d.hn_url}">Hacker News item ${d.hn_item_id}</a>`
  )
  s = s.concat('\n')
  s = s.concat(`<pre>${d.ad}</pre>`)

  s = s.concat('\n\n')
  s = s.concat(`<i>Sent by ${APP_ID}</i>`)

  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  return s.concat('\n')
}

const renderTelegramErrorMessage = (err) => {
  let s = `<b>${EMOJI.Robot} ASK HN: Freelancer? Looking for work?</b>`

  s = s.concat('\n\n')
  const title = err.name || 'Error'
  s = s.concat(`<b>${title}</b>`)
  s = s.concat('\n')
  s = s.concat(`<pre>${err.message}</pre>`)

  s = s.concat('\n\n')
  s = s.concat(`<i>Sent by ${APP_ID}</i>`)

  return s.concat('\n')
}

/**
 * Script to post my ad on ASK HN: Freelancer? Looking for work?
 *
 * This script is meant to be used in a GitHub worklow, but can also be run locally.
 *
 * Usage:
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs <hn_item_id>
 *
 * Example:
 * post ad for March 2023
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs 34983766
 *
 * See also:
 * https://news.ycombinator.com/submitted?id=whoishiring
 */

const postAdOnHackerNews = async () => {
  const args = process.argv.slice(2)
  if (args.length !== 1) {
    throw new Error(
      [
        `INCORRECT NUMBER OF ARGUMENTS\n`,
        `USAGE:`,
        `node post-ad-on-hn-freelancer.cjs <hn_item_id>`
      ].join('\n')
    )
  }
  const hn_item_id = args[0]

  let ad = ''
  if (process.env.GITHUB_SHA) {
    if (!process.env.HN_AD) {
      throw new Error(`environment variable HN_AD not set`)
    }
    ad = process.env.HN_AD
  } else {
    const filepath = path.join('assets', 'ads', 'ask-hn-freelancer.txt')
    ad = fs.readFileSync(filepath).toString()
  }

  let hn_json = ''
  if (process.env.GITHUB_SHA) {
    if (!process.env.HACKER_NEWS) {
      throw new Error(`environment variable HACKER_NEWS not set`)
    }
    hn_json = process.env.HACKER_NEWS
  } else {
    const filepath = path.join('secrets', 'hacker-news.json')
    hn_json = fs.readFileSync(filepath).toString()
  }
  const { username, password } = JSON.parse(hn_json)

  const browser = await chromium.launch({
    headless: process.env.GITHUB_SHA ? true : false
  })

  const page = await browser.newPage()
  const hn_url = `https://news.ycombinator.com/item?id=${hn_item_id}`
  await page.goto(hn_url)

  // navigate to login page
  await page.locator(`a[href="login?goto=item%3Fid%3D${hn_item_id}"]`).click()

  // submit login credentials
  await page.locator('input[type="text"]').first().fill(username)
  await page.locator('input[type="password"]').first().fill(password)
  await page.locator('input[type="submit"]').first().click()

  await page.locator('textarea').fill(ad)
  // we can't immediately post the ad. HN would understand this is an automated
  // submission. Explicitly waiting for a few seconds seems to bypass the HN
  // detection algorithm.
  await waitMs(25000)
  // Note: initially I had thought of using waitForFunction, which executes JS
  // in the browser. But this can't be done because Hacker News has a
  // Content-Security-Policy that prevents JS execution.
  // https://playwright.dev/docs/api/class-page#page-wait-for-function
  await page.getByText('add comment').click()

  await browser.close()

  return { ad, hn_url, hn_item_id }
}

postAdOnHackerNews()
  .then(renderTelegramSuccessMessage)
  .catch(renderTelegramErrorMessage)
  .finally(sendOutput)
