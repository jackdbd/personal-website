const fs = require('fs');
const path = require('path');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const winston = require('winston');
const { allowedResources } = require('./allowed-resources');
const { contentSecurityPolicyFromJSON } = require('./csp');
const { buildSW } = require('./build-sw');

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

const writeCSPinNetlifyToml = async (csp, options) => {
  const { netlifyTomlPath = 'netlify.toml', reportOnly = false } =
    options || {};
  if (csp === undefined) {
    throw new Error(
      'csp must be a valid value for the Content-Security-Policy header, or the Content-Security-Policy-Report-Only header'
    );
  }

  let header = '';
  try {
    let str = await readFileAsync(netlifyTomlPath, 'utf8');
    if (reportOnly) {
      header = `Content-Security-Policy-Report-Only = "${csp}"`;
      str = str.replace(/Content-Security-Policy-Report-Only = ".*"/, header);
    } else {
      header = `Content-Security-Policy = "${csp}"`;
      str = str.replace(/Content-Security-Policy = ".*"/, header);
    }
    logger.debug(`Injecting ${header} in ${netlifyTomlPath}`);
    await writeFileAsync(netlifyTomlPath, str);
    logger.debug(`${netlifyTomlPath} updated`);
  } catch (err) {
    throw new Error(
      `Could not write CSP in ${netlifyTomlPath} \n${err.message}`
    );
  }
};

const writeJSON = async (filepath, resources) => {
  const json = JSON.stringify(resources, undefined, 2);
  try {
    await writeFileAsync(filepath, json);
  } catch (err) {
    throw new Error(`Could not write ${filepath}\n${err.message}`);
  }
};

// 11ty outputs the generated html pages in this directory.
const BUILD_ROOT = '_site';

const CONFIG = {
  cssRootDir: path.join(BUILD_ROOT, 'assets', 'css'),
  jsRootDir: path.join(BUILD_ROOT, 'assets', 'js'),
  htmlFilepaths: [
    path.join(BUILD_ROOT, 'index.html'),
    path.join(BUILD_ROOT, '404.html'),
    path.join(BUILD_ROOT, 'about', 'index.html'),
    path.join(BUILD_ROOT, 'contact', 'index.html'),
    path.join(BUILD_ROOT, 'projects', 'index.html'),
    path.join(BUILD_ROOT, 'styleguide', 'index.html'),
    path.join(BUILD_ROOT, 'success', 'index.html'),
    path.join(
      BUILD_ROOT,
      'posts',
      '12-years-of-fires-in-sardinia',
      'index.html'
    )
  ],
  inlineStyles: [
    {
      css: 'position:relative;width:100%;padding-top: 56.25%;',
      description: 'youtube-embed-div-container-inline-style'
    },
    {
      css:
        'position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;',
      description: 'youtube-embed-iframe-inline-style'
    }
  ]
};

// TODO: pass CONFIG from .eleventy.js afterBuild event handler
const writeAllowedResourcesForContentSecurityPolicyAsJSON = async (
  filepath
) => {
  const resources = await allowedResources(CONFIG);
  logger.info(
    `The Content-Security-Policy will allow ${resources.length} resources`
  );

  const verbose = false;
  if (verbose) {
    const log = (resource) => {
      logger.debug(JSON.stringify(resource, undefined, 2));
    };
    resources.forEach(log);
  }

  await writeJSON(filepath, resources);
};

// const JSON_FILE = 'csp-allowed-resources.json';
// writeAllowedResourcesForContentSecurityPolicyAsJSON(JSON_FILE)
//   .then(console.log)
//   .catch(console.error);

module.exports = {
  buildSW,
  writeAllowedResourcesForContentSecurityPolicyAsJSON,
  contentSecurityPolicyFromJSON,
  writeCSPinNetlifyToml
};
