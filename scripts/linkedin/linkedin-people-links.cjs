const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { debuglog } = require('node:util')
const { sendOutput } = require('../utils.cjs')

const debug = debuglog('github-workflow')
const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

const entry = (d, i) => {
  debug(`entries[${i}] %O`, d)
  const arr = [`${i + 1}. <a href="${d.navigation_url}">${d.title}</a>`]
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
    'linkedin-people.sql'
  )
  const sql = fs.readFileSync(filepath).toString()
  debug(`SQL query:\n%s`, sql)

  const buf = execSync(`steampipe query "${sql}" --output json`)
  const arr = JSON.parse(buf.toString())

  if (!arr) {
    let s = `<b>Steampipe query found no data</b>`
    s = s.concat('\n', `<pre>${sql}<pre>`, '\n')
    console.log(s)
    return
  }

  let s = `<b>🤖 LinkedIn people</b>`
  s = s.concat('\n\n')
  const entries = arr.map(entry)
  s = s.concat(entries.join('\n\n'))
  s = s.concat('\n\n')
  s = s.concat(`<i>Sent by ${app_id}</i>`)
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  s = s.concat('\n')
  return s
}

main().then(sendOutput)
