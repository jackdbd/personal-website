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

const content_origin = 'https://content.giacomodebidda.com'

const description = "Giacomo Debidda's personal website and blog"

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
  content_origin,
  description,
  lang,
  ogp,
  profilePic,
  short_name,
  title,
  url
}

debug(`global data available in each 11ty template %O`, data)

export default data
