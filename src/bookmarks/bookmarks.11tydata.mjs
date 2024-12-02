import defDebug from 'debug'
import { arrayFy } from '../../11ty/filters.mjs'

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
      return arrayFy(data['mp-syndicate-to'])
    },
    syndication: (data) => {
      return arrayFy(data['syndication'])
    },
    tags: (data) => {
      return [...data.tags, ...arrayFy(data['category'])]
    }
  },
  layout,
  tags: ['bookmark']
}
