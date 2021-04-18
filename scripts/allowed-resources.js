const fs = require('fs');
const path = require('path');
const util = require('util');
const readDirAsync = util.promisify(fs.readdir);
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const CleanCSS = require('clean-css');
const { minify } = require('terser');
const winston = require('winston');
const { hashFromString, hashesFromStyleTagsInHtmlPages } = require('./hash');

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

// style-src-attr resource allowed by the Content-Security-Policy.
const styleSrcAttr = ({ css, description }) => {
  return {
    csp_directive: 'style-src-attr',
    description,
    sha256: hashFromString(css)
  };
};

// style-src-elem resource allowed by the Content-Security-Policy (inline <style>).
const styleSrcElemInlineResource = (sha256) => {
  return {
    csp_directive: 'style-src-elem',
    description: 'inline-style',
    sha256
  };
};

// filepaths: paths to HTML pages
const styleTagResources = async (filepaths) => {
  try {
    const hashes = await hashesFromStyleTagsInHtmlPages(filepaths);
    return hashes.map(styleSrcElemInlineResource);
  } catch (err) {
    const msg = `Could not generate CSP resources for some of the ${filepaths.length} filepaths\n${err.message}`;
    throw new Error(msg);
  }
};

const assetFullpaths = async (assetRootDir) => {
  const toFullpath = (name) => path.join(assetRootDir, name);
  try {
    const filenames = await readDirAsync(assetRootDir);
    return filenames.map(toFullpath);
  } catch (err) {
    throw err;
  }
};

const minifiedCSS = (source) => {
  const output = new CleanCSS({
    compatibility: '*',
    level: 2, // if 2  breaks something, try 1
    sourceMap: false
  }).minify(source);
  // console.log('minifiedCSS', output);
  return output.styles;
};

// style-src-elem resource allowed by the Content-Security-Policy (external
// stylesheet referenced in <link>).
const styleSrcElemExternalResource = ({ filepath, sha256 }) => {
  return {
    csp_directive: 'style-src-elem',
    filepath,
    sha256
  };
};

// filepath: fullpath to a CSS file
const linkTagResource = async (filepath) => {
  try {
    const buffer = await readFileAsync(filepath, 'utf8');
    const minified = minifiedCSS(buffer);
    // this minifies the CSS file in place
    await writeFileAsync(filepath, minified);
    const sha256 = hashFromString(minified);
    return styleSrcElemExternalResource({ filepath, sha256 });
  } catch (err) {
    throw err;
  }
};

const linkTagResources = async (cssRootDir) => {
  try {
    const filepaths = await assetFullpaths(cssRootDir);
    const resources = await Promise.all(filepaths.map(linkTagResource));
    return resources;
  } catch (err) {
    throw err;
  }
};

// script-src-elem resource allowed by the Content-Security-Policy (external
// Javascript files referenced in <script>).
const scriptSrcElemResource = ({ filepath, sha256 }) => {
  return {
    csp_directive: 'script-src-elem',
    filepath,
    sha256
  };
};

// filepath: fullpath to a JS file
const scriptTagResource = async (filepath) => {
  try {
    const source = await readFileAsync(filepath, 'utf8');

    let result;
    try {
      // https://terser.org/docs/api-reference#minify-options-structure
      // TODO: configure source maps. I'm getting this error at the moment:
      // net::ERR_INVALID_CHUNKED_ENCODING
      // https://github.com/terser/terser#source-map-options
      result = await minify(source, { sourceMap: true });
    } catch (error) {
      const { message, filename, line, col, pos } = error;
      logger.warn(
        `Could not minify ${filepath}: ${message} at line ${line}, col ${col}, pos ${pos} - skipping and use original file`
      );
    }

    if (result !== undefined) {
      const name = path.basename(filepath, '.js');
      const sourceMapPath = path.join(path.dirname(filepath), `${name}.js.map`);
      await writeFileAsync(sourceMapPath, result.map);
      await writeFileAsync(filepath, result.code);
      const sha256 = hashFromString(result.code);
      return scriptSrcElemResource({ filepath, sha256 });
    } else {
      const sha256 = hashFromString(source);
      return scriptSrcElemResource({ filepath, sha256 });
    }
  } catch (err) {
    throw err;
  }
};

const scriptTagResources = async (jsRootDir) => {
  try {
    const filepaths = await assetFullpaths(jsRootDir);
    const resources = await Promise.all(filepaths.map(scriptTagResource));
    return resources;
  } catch (err) {
    throw err;
  }
};

// Resources allowed by the Content-Security-Policy of this website.
const allowedResources = async ({
  cssRootDir,
  htmlFilepaths,
  inlineStyles,
  jsRootDir
}) => {
  const styleSrcAttrRes = inlineStyles.map(styleSrcAttr);
  try {
    const styleTagRes = await styleTagResources(htmlFilepaths);
    const linkTagRes = await linkTagResources(cssRootDir);
    const scriptTagRes = await scriptTagResources(jsRootDir);
    return [...styleSrcAttrRes, ...styleTagRes, ...linkTagRes, ...scriptTagRes];
  } catch (err) {
    throw err;
  }
};

module.exports = {
  allowedResources
};
