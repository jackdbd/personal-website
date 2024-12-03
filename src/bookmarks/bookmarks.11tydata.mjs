import defDebug from 'debug'
import { arrayFy, urlToHrefAndText } from '../../11ty/filters.mjs'

const debug = defDebug('11ty:data:bookmarks')

const layout = 'bookmark.njk'
debug(`render each bookmark with layout ${layout}`)

export default {
  eleventyComputed: {
    bookmarkOf: (data) => {
      // console.log('=== data for bookmarks ===', data)
      return data['bookmark-of']
    },
    mpSyndicateTo: (data) => {
      const urls = arrayFy(data['mp-syndicate-to'])
      return urls.map(urlToHrefAndText)
    },
    syndication: (data) => {
      const urls = arrayFy(data['syndication'])
      return urls.map(urlToHrefAndText)
    },
    tags: (data) => {
      return [...data.tags, ...arrayFy(data['category'])].map((s) =>
        s.toLowerCase()
      )
    }
  },
  layout,
  tags: ['bookmark']
}
