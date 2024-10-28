import defDebug from 'debug'

const debug = defDebug('11ty:data:photos')

const layout = 'photo.njk'
debug(`render each photo with layout ${layout}`)

export default {
  layout,
  tags: ['photo']
}
