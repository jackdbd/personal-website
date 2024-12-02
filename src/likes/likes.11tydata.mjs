import defDebug from 'debug'
import { arrayFy } from '../../11ty/filters.mjs'

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
  ogp: {
    type: 'article'
  },
  tags: ['like']
}
