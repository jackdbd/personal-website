import defDebug from 'debug'

const debug = defDebug('11ty:data:feed')

const feed = {
  articles: {
    href: '/feeds/articles.xml',
    title: "Giacomo Debidda's articles"
  },
  bookmarks: {
    href: '/feeds/bookmarks.xml',
    title: "Giacomo Debidda's bookmarks"
  },
  likes: {
    href: '/feeds/likes.xml',
    title: "Giacomo Debidda's likes"
  },
  notes: {
    href: '/feeds/notes.xml',
    title: "Giacomo Debidda's notes"
  },
  talks: {
    href: '/feeds/talks.xml',
    title: "Giacomo Debidda's talks"
  }
}

debug(`feed available in each 11ty template %O`, feed)

export default feed
