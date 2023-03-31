const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')

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
 * Script to post my ad on ASK HN: Freelancer? Looking for work?
 *
 * This script is meant to be used in a GitHub worklow, but can also be run locally.
 *
 * Usage:
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs <hn_item_id>
 *
 * Example: post ad for March 2023
 * node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs 34983766
 */

const main = async () => {
  // console.log('=== process.env ===', process.env)

  const args = process.argv.slice(2)
  // console.log('=== args ===', args)
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
  await waitMs(5000)
  // Note: initially I had thought of using waitForFunction, which executes JS
  // in the browser. But this can't be done because Hacker News has a
  // Content-Security-Policy that prevents JS execution.
  // https://playwright.dev/docs/api/class-page#page-wait-for-function
  await page.getByText('add comment').click()

  await browser.close()

  let s = `This ad was posted on <a href="${hn_url}">Hacker News item ${hn_item_id}</a>`
  s = s.concat('\n\n')
  s = s.concat(`<pre>${ad}</pre>`)
  s = s.concat('\n')
  // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
  console.log(s)
}

main()
