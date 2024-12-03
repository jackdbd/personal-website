/**
 * 11ty collections
 * https://www.11ty.dev/docs/collections/
 * https://photogabble.co.uk/tutorials/how-to-programmatically-add-tags-to-posts-in-11ty/
 */
import defDebug from 'debug'

const debug = defDebug(`11ty-config:collections`)

const isUserDefinedTag = (tag) => {
  switch (tag) {
    // this list should match the `filter` list in pages/articles-tagged-with-tag.njk
    case 'all':
    case 'article':
    case 'articles':
    case 'nav':
      return false
    default:
      return true
  }
}

const makeAddTagsToTagSet = (tagSet, predicate) => {
  debug(`makeAddTagsToTagSet %O`, tagSet)
  return (template) => {
    const d = template.data
    if (d.tags) {
      // const tags = d.tags.filter(predicate)
      // Should I lowercase each tag to avoid duplicates?
      const tags = d.tags.filter(predicate).map((s) => s.toLowerCase())
      debug(
        `${d.page.url} has ${tags.length} tags matching predicate: %o`,
        tags
      )
      for (const tag of tags) {
        tagSet.add(tag)
        debug(`added tag ${tag} to tagSet`)
      }
    } else {
      // console.log('item.data.permalink', item.data.permalink);
    }
  }
}

export const userDefinedTagList = (collection) => {
  const tagSet = new Set()
  const addTagsToTagSet = makeAddTagsToTagSet(tagSet, isUserDefinedTag)
  collection.getAll().forEach(addTagsToTagSet) // mutates tagSet
  return [...tagSet]
}

const favorites = (collection) => {
  // https://www.11ty.dev/docs/collections/#sorting
  const templates = collection.getFilteredByTag('like').reverse()
  debug(`${templates.length} template/s tagged with 'like'`)
  return templates
}

const reposts = (collection) => {
  const templates = collection.getFilteredByTag('repost')
  debug(`${templates.length} template/s tagged with 'repost'`)
  return templates
}

const talks = (collection) => {
  const templates = collection.getAll()
  const data_cascade = templates[0].data
  debug(`${data_cascade['talks'].length} talks`)
  return data_cascade['talks']
}

export default {
  favorites,
  reposts,
  talks,
  userDefinedTagList
}
