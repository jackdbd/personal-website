const crypto = require('crypto');
const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const { hashFromString, workboxRevisionFromString } = require('./hash');

const fn = async (filepath) => {
  try {
    const string = await readFileAsync(filepath, 'utf8');
    const hasher = crypto.createHash('sha256');
    hasher.update(string, 'utf-8');
    return hasher.digest('base64');
    // return workboxRevisionFromString(string);
  } catch (err) {
    throw err;
  }
};

const FILEPATH = '_site/assets/js/back-to-top.js';
// const FILEPATH = '_site/blog/index.html';
// const FILEPATH = '_site/404.html';
// const FILEPATH = '_site/index.html';
fn(FILEPATH).then(console.log).catch(console.error);
