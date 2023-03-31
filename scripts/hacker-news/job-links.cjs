const { execSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const { sendOutput } = require('../utils.cjs')

const splits = __filename.split('/')
const app_id = splits[splits.length - 1]

const anchor = (d, i) => {
  return `${i + 1}. <a href="${d.url}">${d.title} (by ${d.by})</a>`
}

const main = async () => {
  const filepath = path.join(
    'assets',
    'steampipe-queries',
    'hacker-news-jobs-YC.sql'
  )

  const sql = fs.readFileSync(filepath).toString()
  const buf = execSync(`steampipe query "${sql}" --output json`)
  const arr = JSON.parse(buf.toString())

  // let s = arr.map(anchor).join('\n\n')
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  // s = s.concat('\n')
  // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
  // console.log(s)

  let s = `<b>🤖 HackerNews jobs</b>`
  s = s.concat('\n\n')
  const entries = arr.map(anchor)
  s = s.concat(entries.join('\n\n'))
  s = s.concat('\n\n')
  s = s.concat(`<i>Sent by ${app_id}</i>`)
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  s = s.concat('\n')
  return s
}

main().then(sendOutput)
