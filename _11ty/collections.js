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
      return false;
    default:
      return true;
  }
};

const tagList = (collection) => {
  const tagSet = new Set();
  collection.getAll().forEach(function (item) {
    if ('tags' in item.data) {
      let tags = item.data.tags;
      tags = tags.filter(isUserDefinedTag);
      for (const tag of tags) {
        tagSet.add(tag);
      }
    }
  });
  return [...tagSet];
};

module.exports = {
  tagList
};
