const { execSync } = require('node:child_process')

/**
 * Usage:
 * node scripts/linkedin.cjs <company_id>
 *
 * Example:
 * node scripts/linkedin/linkedin.cjs 114426
 */

const entry = (d, i) => {
  const arr = [`${i + 1}. <a href="${d.navigation_url}">${d.title}</a>`]
  if (d.headline) {
    arr.push(`<i>headline</i>: ${d.headline}`)
  }
  if (d.subline) {
    arr.push(`<i>subline</i>: ${d.subline}`)
  }
  return arr.join('\n')
}

// TODO: how to create query paramentes in steampipe?

const sql = (company_id) => {
  return `
  select
    headline,
    id,
    navigation_url,
    title
  from
    linkedin_company_employee
  where
    company_id = ${company_id}
    and member_distance not in ('SELF', 'DISTANCE_1');`
}

const main = async () => {
  const args = process.argv.slice(2)
  if (args.length !== 1) {
    throw new Error(
      [
        `INCORRECT NUMBER OF ARGUMENTS\n`,
        `USAGE:`,
        `node linkedin.cjs <company_id>`
      ].join('\n')
    )
  }
  const company_id = args[0]

  const buf = execSync(`steampipe query "${sql(company_id)}" --output json`)
  const arr = JSON.parse(buf.toString())

  let s = arr.map(entry).join('\n\n')
  // we need to add a newline character, otherwise the GitHub workflow will fail
  // with this error: "Matching delimiter not found"
  s = s.concat('\n')
  // send output to stdout, so we can redirect it to GITHUB_ENV in the GitHub action
  console.log(s)
}

main()
