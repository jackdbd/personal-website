import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defDebug from 'debug'
import yargs from 'yargs'
import {
  defRenderTelegramErrorMessage,
  EMOJI,
  sendOutput,
  steampipe
} from '../utils.mjs'

const debug = defDebug('hn:job-links')

const __filename = fileURLToPath(import.meta.url)
const splits = __filename.split('/')
const app_id = splits[splits.length - 1]
const app_version = '0.1.0'

const DEFAULT = {
  DESCRIPTION: 'Query description not provided',
  QUERY: 'hacker-news-jobs-this-week.sql',
  TITLE: 'Hacker News Jobs'
}

const renderTelegramErrorMessage = defRenderTelegramErrorMessage({
  header: `<b>${EMOJI.Robot} Hacker News job links</b>`,
  footer: `<i>Sent by ${app_id} (vers. ${app_version})</i>`
})

const searchJobsOnHackerNews = async () => {
  const argv = yargs(process.argv.slice(2))
    .usage('node scripts/hacker-news/$0')
    .option('description', {
      alias: 'd',
      default: DEFAULT.DESCRIPTION,
      describe: 'description of the provided query'
    })
    .option('steampipe-query', {
      alias: 'q',
      choices: ['hacker-news-jobs.sql', 'hacker-news-jobs-this-week.sql'],
      default: DEFAULT.QUERY,
      describe: 'steampipe query to use to search stories on Hacker News'
    })
    .option('title', {
      alias: 't',
      default: DEFAULT.TITLE,
      describe: 'title of the provided query'
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

  const buf = execSync(`${steampipe} query "${sql}" --output json`)
  // const buf = execSync(
  //   `${steampipe} query "select title from hackernews_job;"`
  // )

  return {
    app_id,
    description: argv.description,
    links: JSON.parse(buf.toString()),
    title: argv.title
  }
}

const anchor = (d, i) => {
  return `${i + 1}. <a href="${d.url}">${d.title} (by ${d.by})</a>`
}

const renderTelegramMessage = (d) => {
  let s = `<b>${EMOJI.Robot} ${d.title}</b>`

  s = s.concat('\n\n')
  s = s.concat('<b>Description</b>')
  s = s.concat('\n')
  s = s.concat(d.description)
  // console.log('=== d.links.rows ===', d.links.rows)

  s = s.concat('\n\n')
  const entries = d.links.rows.map(anchor)
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
    sendOutput(renderTelegramErrorMessage(err))
  })
