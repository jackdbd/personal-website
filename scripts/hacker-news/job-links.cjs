const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const anchor = (d, i) => {
  return `${i + 1}. <a href="${d.url}">${d.title} (by ${d.by})</a>`
}

/**
 * Script that constructs a string full of links from Hacker News.
 *
 * To be used in a GitHub worklow that sends such string to a Telegram chat.
 *
 * Usage:
 * node scripts/hacker-news/job-links.cjs
 */

const main = async () => {
  const filepath = path.join(
    'assets',
    'steampipe-queries',
    'hacker-news-jobs-YC-this-week.sql'
  )

  const sql = fs.readFileSync(filepath).toString()
  const buf = execSync(`steampipe query "${sql}" --output json`)
  const arr = JSON.parse(buf.toString())

  let s = arr.map(anchor).join('\n\n')
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  s = s.concat('\n')
  // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
  console.log(s)
}

main()
