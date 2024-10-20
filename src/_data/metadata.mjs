import defDebug from 'debug'

const debug = defDebug('11ty:data:metadata')

const author = {
  'cv-one-page':
    'https://raw.githubusercontent.com/jackdbd/jackdbd/main/assets/cv-one-page.pdf',
  'cv-longer-format':
    'https://raw.githubusercontent.com/jackdbd/jackdbd/main/assets/cv-longer-format.pdf',
  email: 'giacomo@giacomodebidda.com',
  name: 'Giacomo Debidda'
}

const build_started = new Date().toISOString()

const description = "Giacomo Debidda's personal website and blog"

const feeds = {
  articles: {
    href: '/feeds/articles.xml',
    title: "Giacomo Debidda's articles"
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

const lang = 'en'

const ogp = {
  type: 'website'
}

const profilePic =
  'https://res.cloudinary.com/jackdbd/image/upload/v1599389496/profile-pic_k8mn6r.jpg'

const short_name = 'giacomodebidda'

const title = 'Giacomo Debidda'
const url = 'https://www.giacomodebidda.com'

const data = {
  author,
  build_started,
  description,
  feeds,
  lang,
  ogp,
  profilePic,
  short_name,
  title,
  url
}

debug(`global data available in each 11ty template %O`, data)

export default data
