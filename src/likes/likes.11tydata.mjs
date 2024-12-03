import defDebug from 'debug'
import { arrayFy, urlToHrefAndText } from '../../11ty/filters.mjs'

const debug = defDebug('11ty:data:likes')

const layout = 'like.njk'
debug(`render each like with layout ${layout}`)

export default {
  eleventyComputed: {
    likeOf: (data) => {
      // console.log('=== data for likes ===', data)
      return data['like-of']
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
  ogp: {
    type: 'article'
  },
  tags: ['like']
}
