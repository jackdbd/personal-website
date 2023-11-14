const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
const { EMOJI, waitMs, sendOutput } = require('../utils.cjs')
const { latestPost } = require('../hacker-news.cjs')

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

const postAdOnHackerNews = async ({ browser, hn_item_id }) => {
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

  const page = await browser.newPage()
  const hn_url = `https://news.ycombinator.com/item?id=${hn_item_id}`
  await page.goto(hn_url)

  // navigate to login page
  await page.locator(`a[href="login?goto=item%3Fid%3D${hn_item_id}"]`).click()

  // submit login credentials
  await page.locator('input[type="text"]').first().fill(username)
  await page.locator('input[type="password"]').first().fill(password)
  // This selector is fine, but somehow HN flags this script as a "Bad Login".
  await page.locator('input[type="submit"]').first().click()
  // I tried to add a waiting time (up to 15s) but it seems not to work.

  await page.locator('textarea').fill(ad)
  // we can't immediately post the ad. HN would understand this is an automated
  // submission. Explicitly waiting for a few seconds seems to bypass the HN
  // detection algorithm.
  await waitMs(5000)

  // Hacker News seems to update the page, so this selector changes quite often.
  const locator = page.locator('input[type="submit"]')
  // const locator = page.getByText('add comment')
  await locator.click()

  const loc = page.getByText("Sorry, but you've already posted here").first()
  const text_content = await loc.textContent({ timeout: 5000 })
  if (text_content) {
    throw new Error(`You have already posted this ad to ${hn_url}`)
  }

  // Initially I had thought of using waitForFunction, which executes JS in the
  // browser. But this can't be done because Hacker News has a
  // Content-Security-Policy that prevents JS execution.
  // https://playwright.dev/docs/api/class-page#page-wait-for-function
  // await page.getByText('add comment').click()

  return { ad, hn_url, hn_item_id }
}

/**
 * Script to post my ad on ASK HN: Freelancer? Looking for work?
 *
 * This script is meant to be used in a GitHub worklow, but can also be run locally.
 *
 * Usage:
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs <hn_item_id>
 *
 * Example:
 * post ad for this month
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs
 * post ad for March 2023
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs 34983766
 *
 * See also:
 * https://news.ycombinator.com/submitted?id=whoishiring
 */

const main = async () => {
  const args = process.argv.slice(2)

  let text = `<b>${EMOJI.Robot} ASK HN: Freelancer? Looking for work?</b>`
  text = text.concat('\n\n')
  text = text.concat('If you see this, something went wrong and must be fixed')
  text = text.concat('\n\n')
  text = text.concat(`<i>Sent by ${APP_ID}</i>`)

  const browser = await chromium.launch({
    headless: process.env.GITHUB_SHA ? true : false
  })

  let hn_item_id = undefined
  if (args.length === 0) {
    const result = await latestPost()
    hn_item_id = result.item_id
  } else if (args.length === 1) {
    hn_item_id = args[0]
  } else {
    throw new Error(
      [
        `INCORRECT NUMBER OF ARGUMENTS\n`,
        `USAGE:`,
        `node post-ad-on-hn-freelancer.cjs OR node post-ad-on-hn-freelancer.cjs <hn_item_id>`
      ].join('\n')
    )
  }

  try {
    const d = await postAdOnHackerNews({ browser, hn_item_id })
    text = renderTelegramSuccessMessage(d)
  } catch (err) {
    text = renderTelegramErrorMessage(err)
  } finally {
    await browser.close()
    await sendOutput(text)
  }
}

main()
