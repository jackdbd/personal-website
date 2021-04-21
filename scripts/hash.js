const crypto = require('crypto');
const winston = require('winston');
const { styleTagsContents } = require('./style-tags-contents');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// TODO: add info about string. E.g. the string YOUTUBE_EMBED_DIV_INLINE_STYLE
// could hava the description: youtube-embed-div-container-inline-style
const hashFromString = (str) => {
  const sha256Hasher = crypto.createHash('sha256');
  logger.debug(`Generating base64-encoded SHA-256 from string: ${str}`);
  const sha256 = sha256Hasher.update(str, 'utf-8').digest('base64');
  return `sha256-${sha256}`;
};

const hashesFromStyleTagsInHtmlPage = async (filepath) => {
  logger.debug(`Generating hashes from <style> tags in ${filepath}`);
  try {
    const contents = await styleTagsContents(filepath);
    const hashes = contents.map(hashFromString);
    logger.debug(filepath, '=>', hashes);
    return hashes;
  } catch (err) {
    throw new Error(
      `Could not generate hashes for ${filepath}\n${err.message}`
    );
  }
};

// Generate an array of unique hashes from the content of all the <style> tags
// of all the HTML pages passed in.
const hashesFromStyleTagsInHtmlPages = async (filepaths) => {
  const promises = filepaths.map(hashesFromStyleTagsInHtmlPage);
  try {
    const hashes = await Promise.all(promises); // list of lists
    return [...new Set(hashes.flatMap((hash) => hash))];
  } catch (err) {
    const msg = `Could not generate hashes for some of the ${filepaths.length} filepaths\n${err.message}`;
    throw new Error(msg);
  }
};

// This is how Workbox generate the `revision` for an asset.
// https://github.com/GoogleChrome/workbox/blob/v6/packages/workbox-build/src/lib/get-string-hash.js
const workboxRevisionFromString = (string) => {
  const md5 = crypto.createHash('md5');
  md5.update(string);
  return md5.digest('hex');
};

module.exports = {
  hashFromString,
  hashesFromStyleTagsInHtmlPages,
  workboxRevisionFromString
};
