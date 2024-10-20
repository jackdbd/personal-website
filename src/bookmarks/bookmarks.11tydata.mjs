import defDebug from 'debug'

const debug = defDebug('11ty:data:bookmarks')

const layout = 'bookmark.njk'
debug(`render each bookmark with layout ${layout}`)

export default {
  layout,
  tags: ['bookmark']
}
