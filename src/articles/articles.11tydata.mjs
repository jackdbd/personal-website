import defDebug from 'debug'

const debug = defDebug('11ty:data:articles')

const layout = 'post.njk' // rename 'article.njk' when done migrating to articles
debug(`render each article with layout ${layout}`)

export default {
  layout,
  ogp: {
    type: 'article'
  },
  tags: ['article', 'post'] // remove 'post' when done migrating to articles
}
