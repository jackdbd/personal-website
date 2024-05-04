import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { debuglog } from 'node:util'
import { fileURLToPath } from 'node:url'
import PrettyError from 'pretty-error'
import yargs from 'yargs'
import { EMOJI, sendOutput } from '../utils.mjs'

const debug = debuglog('hn:job-links')

const pe = new PrettyError()

const __filename = fileURLToPath(import.meta.url)
const splits = __filename.split('/')
const APP_ID = splits[splits.length - 1]

const DEFAULT = {
  DESCRIPTION: 'Query description not provided',
  QUERY: 'hacker-news-jobs-YC.sql'
}

const searchJobsOnHackerNews = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('node scripts/hacker-news/$0')
    .option('description', {
      alias: 'd',
      default: DEFAULT.DESCRIPTION,
      describe: 'human-friendly description of the provided query'
    })
    .option('steampipe-query', {
      alias: 'q',
      choices: ['hacker-news-jobs.sql', 'hacker-news-jobs-YC.sql'],
      default: DEFAULT.QUERY,
      describe: 'steampipe query to use to search stories on Hacker News'
    })
    .help('help').argv

  const filepath = path.join(
    'assets',
    'steampipe-queries',
    argv['steampipe-query']
  )

  debug(`use SQL query found at ${filepath}`)
  const sql = fs.readFileSync(filepath).toString()
  debug(`execute this SQL query with steampipe:\n${sql}`)
  const buf = execSync(`steampipe query "${sql}" --output json`)

  return {
    app_id: APP_ID,
    description: argv.description,
    links: JSON.parse(buf.toString())
  }
}

const anchor = (d, i) => {
  return `${i + 1}. <a href="${d.url}">${d.title} (by ${d.by})</a>`
}

const renderTelegramMessage = (d) => {
  let s = `<b>${EMOJI.Robot} Hacker News jobs</b>`

  s = s.concat('\n\n')
  s = s.concat('<b>Description</b>')
  s = s.concat('\n')
  s = s.concat(d.description)

  s = s.concat('\n\n')
  const entries = d.links.map(anchor)
  s = s.concat('<b>Job links</b>')
  s = s.concat('\n')
  s = s.concat(entries.join('\n\n'))

  s = s.concat('\n\n')
  s = s.concat(`<i>Sent by ${d.app_id}</i>`)

  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  return s.concat('\n')
}

searchJobsOnHackerNews()
  .then(renderTelegramMessage)
  .then(sendOutput)
  .catch((err) => {
    console.log(pe.render(err))
  })
