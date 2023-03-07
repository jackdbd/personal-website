const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { debuglog } = require('node:util')
const debug = debuglog('github-workflow')

/**
 * Script that constructs a string full of links from LinkedIn companies.
 *
 * To be used in a GitHub worklow that sends such string to a Telegram chat.
 *
 * Usage:
 * node scripts/linkedin-companies-links.cjs
 *
 * See also:
 * https://hub.steampipe.io/plugins/turbot/linkedin/tables/linkedin_search_company
 */

const entry = (d, i) => {
  debug(`entries[${i}] %O`, d)
  const href = `https://www.linkedin.com/company/${d.id}`
  const arr = [`${i + 1}. <a href="${href}">${d.title}</a>`]
  arr.push(`<i>company_id</i>: <code>${d.id}</code>`)
  if (d.headline) {
    arr.push(`<i>headline</i>: ${d.headline}`)
  }
  if (d.subline) {
    arr.push(`<i>subline</i>: ${d.subline}`)
  }

  return arr.join('\n')
}

const main = async () => {
  const filepath = path.join(
    'assets',
    'steampipe-queries',
    'linkedin-companies.sql'
  )
  const sql = fs.readFileSync(filepath).toString()
  debug(`SQL query:\n%s`, sql)

  const buf = execSync(`steampipe query "${sql}" --output json`)
  const arr = JSON.parse(buf.toString())

  let s = arr.map(entry).join('\n\n')
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  s = s.concat('\n')
  // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
  console.log(s)
}

main()
