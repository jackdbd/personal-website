import defDebug from 'debug'

const debug = defDebug('11ty:data:articles')

const layout = 'article.njk'
debug(`render each article with layout ${layout}`)

export default {
  layout,
  ogp: {
    type: 'article'
  },
  tags: ['article', 'post'] // remove 'post' when done migrating to articles
}
