import defDebug from 'debug'

const debug = defDebug('11ty:data:likes')

const layout = 'like.njk'
debug(`render each like with layout ${layout}`)

export default {
  layout,
  ogp: {
    type: 'article'
  },
  tags: ['like']
}
