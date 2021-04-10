const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cspBuilder = require('content-security-policy-builder');
const { cssmin, jsmin } = require('./_11ty/filters');

const hash = (filepath) => {
  const sha256Hasher = crypto.createHash('sha256');
  console.log(`Generating hash for ${filepath}`);
  const ext = path.extname(filepath);
  try {
    let str = fs.readFileSync(filepath, 'utf8');
    // console.log('BEFORE MINIFY', str);
    str = ext === '.css' ? cssmin(str) : jsmin(str);
    // console.log('AFTER MINIFY', str);
    const sha256 = sha256Hasher.update(str, 'utf-8').digest('base64');
    // console.log(filepath, '=>', sha256);
    return { ext: ext, sha256: `'sha256-${sha256}'` };
  } catch (err) {
    console.error(err);
  }
};

const writeNetlifyToml = (csp_value) => {
  const NETLIFY_TOML_PATH = 'netlify.toml';
  console.log(`Injecting Content-Security-Policy in ${NETLIFY_TOML_PATH}`);
  const csp = `Content-Security-Policy = "${csp_value}"`;
  try {
    let str = fs.readFileSync(NETLIFY_TOML_PATH, 'utf8');
    str = str.replace(/Content-Security-Policy = ".*"/, csp);
    fs.writeFileSync(NETLIFY_TOML_PATH, str);
    console.log(`${NETLIFY_TOML_PATH} updated`);
  } catch (err) {
    console.error(err);
  }
};

const makeCsp = (assets) => {
  const isCss = (asset) => asset.ext === '.css';
  const isJs = (asset) => asset.ext === '.js';
  const sha256 = (asset) => asset.sha256;
  const allowedStyleSources = assets.filter(isCss).map(sha256);
  const allowedScriptElements = assets.filter(isJs).map(sha256);
  // console.log('allowedStyleSources', allowedStyleSources);
  // console.log('allowedScriptElements', allowedScriptElements);
  console.log(`Generating Content-Security-Policy and injecting SHAs`);

  const reportUri = 'https://giacomodebidda.report-uri.com';

  // connect-src
  // I need to download web fonts from Google Fonts, and images from Cloudinary

  // default-src
  // I would like to use default-src: 'none', but prefetch-src is currently not
  // supported by any browser, so I have no choice. I cannot use default-src: 'none'
  // because it would prevent prefetching resources from this origin (which I am
  // doing with instant.page.js).
  // https://caniuse.com/?search=prefetch-src

  // font-src
  //  allow only font files hosted on this origin (self-hosted) or on Google Fonts.

  // frame-src
  // allow iframes from YouTube, Vimeo.

  // img-src
  // allow images hosted on this origin or on my Cloudinary media library.

  // prefetch-src
  // Still not supported by any browser, but it falls back to default-src.
  // That's why I set 'default-src' to 'self' instead of 'none'.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/prefetch-src

  // report-to: indicate a groupname that matches one of the groups defined in
  // the Report-To header.

  // report-uri
  // send CSP violations to reporting service
  // Note: report-uri is a deprecated CSP directive, but I include it here
  // because Firefox does not yet support the report-to CSP directive, nor the
  // Report-To header.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri

  // script-src-attr
  // Allow inline event handlers only for this origin.

  // script-src-elem, style-src
  // This website has some CSS inlined in the <head> for performance reasons
  // (critical CSS). The CSP allows inline styles only when either
  // 'unsafe-inline', a nonce or a base64 SHA are used. It's better to avoid
  // 'unsafe-inline' altogether, and since this is a static website hosted on
  // Netlify (i.e. there isn't a web server under my control) the only secure
  // option available is to generate all SHAs at build time and inject them in
  // the netlify.toml.
  // This website has some JS assets. I generate SHAs for them too.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script

  return cspBuilder({
    directives: {
      'base-uri': ["'self'"],
      'connect-src': [
        "'self'",
        'https://fonts.googleapis.com',
        'https://fonts.gstatic.com',
        'https://res.cloudinary.com'
      ],
      'default-src': ["'self'"],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'frame-src': [
        'https://www.youtube.com/embed/',
        'https://player.vimeo.com/video/'
      ],
      'img-src': ["'self'", 'https://res.cloudinary.com/jackdbd/image/upload/'],
      'manifest-src': ["'self'"],
      'media-src': [
        "'self'",
        'https://res.cloudinary.com/jackdbd/image/upload/'
      ],
      'object-src': ["'none'"],
      'report-to': 'default',
      'report-uri': reportUri,
      'script-src-attr': ["'self'"],
      'script-src-elem': ["'self'", ...allowedScriptElements],
      'style-src': [
        "'self'",
        ...allowedStyleSources,
        'https://fonts.googleapis.com',
        'https://unpkg.com/prismjs@1.20.0/themes/prism-okaidia.css'
      ],
      'upgrade-insecure-requests': true
    }
  });
};

const hashes = (assets) => {
  return assets.map(hash);
};

const prebuild = () => {
  const csp = makeCsp(
    hashes([
      'src/includes/assets/css/inline.css',
      'src/includes/assets/js/back-to-top.js',
      'src/includes/assets/js/inline.js',
      'src/includes/assets/js/sw-registration.js',
      'src/includes/assets/js/theme-switcher.js'
    ])
  );
  // console.log('CSP', csp);
  writeNetlifyToml(csp);
};

module.exports = prebuild;
