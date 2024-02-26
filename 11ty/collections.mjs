/**
 * 11ty collections
 * https://www.11ty.dev/docs/collections/
 * https://photogabble.co.uk/tutorials/how-to-programmatically-add-tags-to-posts-in-11ty/
 */
import makeDebug from 'debug'

const debug = makeDebug(`11ty-config:collections`)

const isUserDefinedTag = (tag) => {
  switch (tag) {
    // this list should match the `filter` list in pages/posts-tagged-with-tag.njk
    case 'all':
    case 'nav':
    case 'post':
    case 'posts':
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
      const tags = d.tags.filter(predicate)
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
  collection.getAll().forEach(addTagsToTagSet)
  return [...tagSet]
}

const likes = (collection) => {
  const templates = collection.getFilteredByGlob('./src/_likes/*.md')
  debug(`${templates.length} likes`)
  return templates
}

const notes = (collection) => {
  const templates = collection.getFilteredByGlob('./src/_notes/*.md')
  debug(`${templates.length} notes`)
  return templates
}

const reposts = (collection) => {
  const templates = collection.getFilteredByGlob('./src/_reposts/*.md')
  debug(`${templates.length} reposts`)
  return templates
}

const talks = (collection) => {
  const data_cascade = collection.getAll()[0].data
  debug(`${data_cascade.talks.length} talks`)
  return data_cascade.talks
}

export default {
  likes,
  notes,
  reposts,
  talks,
  userDefinedTagList
}
