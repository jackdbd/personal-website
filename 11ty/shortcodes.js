/**
 * 11ty shortcodes
 * https://www.11ty.dev/docs/shortcodes/
 */

const copyright = (name) => {
  const startYear = 2020
  const stopYear = new Date().toISOString().slice(0, 4)
  return `Copyright © ${startYear} – ${stopYear} ${name} – All rights reserved`
}

const version = () => {
  return String(Date.now())
}

/**
 * https://cloud.google.com/bigquery/docs/saving-sharing-queries
 */
const bigQueryQueryLink = (href) => {
  return `<p><a href="${href}" target="_blank" rel="external noopener noreferrer">Here is the query.</a> Try it out!</p>`
}

module.exports = {
  bigQueryQueryLink,
  copyright,
  version
}
