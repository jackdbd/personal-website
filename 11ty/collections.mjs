/**
 * 11ty collections
 * https://www.11ty.dev/docs/collections/
 */

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
  return (item) => {
    if ('tags' in item.data) {
      // console.log('item.data.tags', item.data.tags);
      let tags = item.data.tags
      tags = tags.filter(predicate)
      for (const tag of tags) {
        tagSet.add(tag)
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

export default {
  userDefinedTagList
}