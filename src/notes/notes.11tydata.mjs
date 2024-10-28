import defDebug from 'debug'

const debug = defDebug('11ty:data:notes')

const layout = 'note.njk'
debug(`render each note with layout ${layout}`)

export default {
  layout,
  ogp: {
    type: 'article'
  },
  tags: ['note']
}
