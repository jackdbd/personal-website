const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const { hashFromString } = require('./hash');

const fn = async (filepath) => {
  try {
    const str = await readFileAsync(filepath, 'utf8');
    // const sha256 = hashFromString(str);
    const sha256Hasher = crypto.createHash('sha256');
    const sha256 = sha256Hasher.update(str, 'utf-8').digest('base64');
    // const sha256 = sha256Hasher.update(str, 'utf-8').digest('hex');
    return sha256;
  } catch (err) {
    throw err;
  }
};

const FILEPATH = '_site/assets/js/back-to-top.js';
// const FILEPATH = '_site/blog/index.html';
// const FILEPATH = '_site/404.html';
fn(FILEPATH).then(console.log).catch(console.error);
