import defDebug from 'debug'

const debug = defDebug('11ty:data:webmentions')

const domain = 'giacomodebidda.com'

// Webmention.io (jf2)
const data = {
  webmention_endpoint: `https://webmention.io/www.${domain}/webmention`,
  webmentions_directory: '.cache-webmentions',
  webmentions_domain: domain,
  webmentions_feed: `https://webmention.io/api/mentions.jf2?domain=www.${domain}&per-page=9001&token=${process.env.WEBMENTION_IO_TOKEN}`,
  webmentions_key: 'children',
  webmentions_token: process.env.WEBMENTION_IO_TOKEN
}

// Webmention.io (json)
// const data = {
//   webmention_endpoint: `https://webmention.io/www.${domain}/webmention`,
//   webmentions_directory: '.cache-webmentions',
//   webmentions_domain: domain,
//   webmentions_feed: `https://webmention.io/api/mentions.json?domain=www.${domain}&per-page=9001&token=${process.env.WEBMENTION_IO_TOKEN}`,
//   webmentions_key: 'links',
//   webmentions_token: process.env.WEBMENTION_IO_TOKEN
// }

// go-jamming
// const go_jamming = JSON.parse(process.env.GO_JAMMING)
// const data = {
//   webmention_endpoint: `https://webmentions.giacomodebidda.com/webmention`,
//   webmentions_directory: '.cache-go-jamming',
//   webmentions_domain: domain,
//   webmentions_feed: `https://webmentions.giacomodebidda.com/webmention/${domain}/${go_jamming.token}`,
//   webmentions_key: 'children',
//   webmentions_token: go_jamming.token
// }

debug(`global data available in each 11ty template %O`, data)

export default data
