import {
  getPublished,
  getWebmentions
} from '@chrisburnell/eleventy-cache-webmentions'
import defDebug from 'debug'
import wm_data from '../_data/webmentions.mjs'

const debug = defDebug('11ty:data:articles')

const layout = 'article.njk'
debug(`render each article with layout ${layout}`)

export default {
  eleventyComputed: {
    webmentionTargetURL: (data) => {
      const domain = wm_data.webmentions_domain
      const relative_path = data.page.url
      const url = new URL(relative_path, `https://www.${domain}`)
      debug(`webmention target URL: ${url}`)
      return url
    },
    webmentionsReceivedAtURL: async (data) => {
      const domain = wm_data.webmentions_domain
      const url = `https://www.${domain}${data.page.url}`

      const wm = await getWebmentions(
        {
          domain: `https://www.${domain}`,
          feed: wm_data.webmentions_feed,
          key: wm_data.webmentions_key,
          directory: wm_data.webmentions_directory
        },
        url
      )
      debug(`${wm.length} webmentions for ${url}`)

      if (wm.length) {
        return wm.sort((a, b) => {
          return getPublished(b) - getPublished(a)
        })
      } else {
        return []
      }
    }
  },
  layout,
  ogp: {
    type: 'article'
  },
  tags: ['article', 'post'] // remove 'post' when done migrating to articles
}
