require('dotenv').config();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cspBuilder = require('content-security-policy-builder');
const { cssmin, jsmin } = require('./_11ty/filters');

if (process.env.SHA_SECRET === undefined) {
  throw new Error('Environment variable SHA_SECRET not set');
}

// Placeholders defined in src/_data/env.template.js
const PLACEHOLDER_MAP = {
  INLINE_CSS: 'INLINE_CSS',
  INLINE_JS: 'INLINE_JS',
  SW_REGISTRATION_JS: 'SW_REGISTRATION_JS'
};

const hash = (filepath) => {
  const sha256Hasher = crypto.createHmac('sha256', process.env.SHA_SECRET);
  console.log(`Generating hash for ${filepath}`);
  const ext = path.extname(filepath);
  try {
    let str = fs.readFileSync(filepath, 'utf8');
    // console.log('BEFORE MINIFY', str);
    str = ext === '.css' ? cssmin(str) : jsmin(str);
    // console.log('AFTER MINIFY', str);
    return sha256Hasher.update(str).digest('hex');
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

const makeCsp = (shasMap) => {
  console.log(`Generating Content-Security-Policy and injecting SHAs`);

  const reportUri = `'${'https://giacomodebidda.report-uri.com'}'`;

  const sha256_inline_css = `'sha256-${shasMap.INLINE_CSS}'`;
  const sha256_inline_js = `'sha256-${shasMap.INLINE_JS}'`;
  const sha256_sw_registration_js = `'sha256-${shasMap.SW_REGISTRATION_JS}'`;

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

  // script-src, script-src-attr, script-src-elem, style-src
  // This website has some CSS and JS inlined in the <head> for performance
  // reasons (critical CSS and JS). The CSP allows inline scripts and
  // stylesheets only when either 'unsafe-inline', a SHA or a nonce are used.
  // It's better to avoid 'unsafe-inline' altogether, so I generate all SHAs and
  // write the netlify.toml at build time.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src#unsafe_inline_script

  // worker-src
  // this should be supported by Chrome and Firefox.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src

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
        "'self",
        'https://res.cloudinary.com/jackdbd/image/upload/'
      ],
      'object-src': ["'none'"],
      'report-to': 'default',
      'report-uri': reportUri,
      'script-src': ["'self'"],
      'script-src-attr': ["'self'", "'unsafe-inline'"],
      'script-src-elem': [
        "'self'",
        sha256_inline_js,
        sha256_sw_registration_js
      ],
      'style-src': [
        "'self'",
        sha256_inline_css,
        'https://fonts.googleapis.com',
        'https://unpkg.com/prismjs@1.20.0/themes/prism-okaidia.css'
      ],
      'upgrade-insecure-requests': true,
      'worker-src': ["'self'"]
    }
  });
};

// Generate mapping placeholder => SHA
const hashesMap = (assets) => {
  return assets.reduce((acc, cv) => {
    const key = cv.placeholder;
    return Object.assign(acc, { [key]: hash(cv.filepath) });
  }, {});
};

const MESSAGE = 'THIS FILE WAS AUTOGENERATED - DO NOT MODIFY!\n';

const writeEleventyDataEnv = (shasMap) => {
  const input = 'src/_data/env.template.js';
  const output = 'src/_data/env.js';
  console.log(`Generating ${output} from ${input} and injecting SHAs`);

  let string = undefined;
  try {
    string = fs.readFileSync(input, 'utf8');
    Object.entries(shasMap).forEach(([placeholder, sha256]) => {
      string = string.replace(placeholder, sha256);
    });
  } catch (err) {
    console.error(err);
  }

  try {
    fs.writeFileSync(output, `// ${MESSAGE} ${string}`);
    console.log(`${output} written to disk`);
  } catch (err) {
    console.error(err);
  }
};

const m = hashesMap([
  {
    filepath: 'src/includes/assets/css/inline.css',
    placeholder: PLACEHOLDER_MAP.INLINE_CSS
  },
  {
    filepath: 'src/includes/assets/js/inline.js',
    placeholder: PLACEHOLDER_MAP.INLINE_JS
  },
  {
    filepath: 'src/includes/assets/js/sw_registration.js',
    placeholder: PLACEHOLDER_MAP.SW_REGISTRATION_JS
  }
]);

writeNetlifyToml(makeCsp(m));
writeEleventyDataEnv(m);
