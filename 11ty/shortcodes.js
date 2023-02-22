/**
 * 11ty shortcodes
 * https://www.11ty.dev/docs/shortcodes/
 */

/**
 * https://cloud.google.com/bigquery/docs/saving-sharing-queries
 */
const bigQueryQueryLink = (href) => {
  return `<p><a href="${href}" target="_blank" rel="external noopener noreferrer">Here is the query.</a> Try it out!</p>`
}

const copyright = (name) => {
  const startYear = 2020
  const stopYear = new Date().toISOString().slice(0, 4)
  return `Copyright © ${startYear} – ${stopYear} ${name} – All rights reserved`
}

/**
 * Renders a shrug emoticon *correctly*.
 *
 * https://en.wiktionary.org/wiki/%C2%AF%5C_(%E3%83%84)_/%C2%AF
 */
const shrugEmoticon = () =>
  `<span class="shrug-emoticon">¯\\\\_(ツ)\\_/¯</span>`

const version = () => {
  return String(Date.now())
}

module.exports = {
  bigQueryQueryLink,
  copyright,
  shrugEmoticon,
  version
}
