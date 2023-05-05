const fs = require('node:fs')
const path = require('node:path')
const { chromium } = require('playwright')
const yargs = require('yargs')

const DEFAULT = {
  ad: 'twitter-freelancing.txt'
}

const main = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage(
      'Post ad for my freelancing service on Twitter.\nUsage: node scripts/twitter/$0'
    )
    .option('ad', {
      default: DEFAULT.ad,
      describe: 'Text to post'
    })
    .help('help').argv

  const filepath = path.join('assets', 'ads', argv.ad)
  const ad = fs.readFileSync(filepath).toString()

  let secret_json = ''
  if (process.env.GITHUB_SHA) {
    if (!process.env.TWITTER) {
      throw new Error(`environment variable TWITTER not set`)
    }
    secret_json = process.env.TWITTER
  } else {
    secret_json = fs
      .readFileSync(path.join('secrets', 'twitter.json'))
      .toString()
  }
  const { username, password } = JSON.parse(secret_json)

  const browser = await chromium.launch({
    headless: process.env.GITHUB_SHA ? true : false
  })

  const page = await browser.newPage()

  const home_url = `https://twitter.com/`
  await page.goto(home_url)

  const span_cookies = await page.$(
    `span:has-text("Refuse non-essential cookies")`
  )
  await span_cookies.click()

  const span_login = await page.$(`span:has-text("Log In")`)
  await span_login.click()

  // submit login credentials
  await page.locator('input[type="text"]').first().fill(username)
  const span_next = await page.$(`span:has-text("Next")`)
  await span_next.click()
  await page.locator('input[type="password"]').first().fill(password)

  // TODO: this doesn't work
  //   const span_login_two = await page.$(`span:has-text("Log in")`)
  //   await span_login_two.click()

  //   const login_url = `https://twitter.com/i/flow/login`

  console.log(`TODO: Post this ad manually on Twitter`)
  console.log(ad)

  await browser.close()
}

main().catch((err) => {
  console.error(err.message)
})
