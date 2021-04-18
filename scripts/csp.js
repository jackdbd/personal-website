const fs = require('fs');
const util = require('util');
const readFileAsync = util.promisify(fs.readFile);
const cspBuilder = require('content-security-policy-builder');

// Generate a Content-Security-Policy that allows only the resources identified
// by a SHA-256 hash.

// This website has some CSS inlined in the <head> for performance reasons
// (critical CSS). The CSP allows inline styles only when either
// 'unsafe-inline', a nonce or a base64 SHA are used. It's better to avoid
// 'unsafe-inline' altogether, and since this is a static website hosted on
// Netlify (i.e. there isn't a web server under my control) the only secure
// option available is to generate all SHAs at build time and inject them in
// the netlify.toml.
const contentSecurityPolicy = (resources) => {
  // I use base-uri: 'self' here, but I am not including a <base> in the <head>
  // at the moment. I don't know how to deal with the fact that the website URL
  // is dynamic. The website could be running locally (either with
  // eleventy --serve or Netlify Dev), or it could be deployed on Netlify (either
  // with a deploy preview or a with a production deploy). If I use <base> with
  // a wrong URL all requests are considered cross-origin, so the browser
  // refuses to fetch resources like sw.js and the webmanifest.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/base-uri
  const baseUri = ["'self'"];

  // This should be just a fallback for frame-src and worker-src, so I guess I
  // don't need it.
  // For backward compatability, both 'child-src' and 'frame-src' should exist
  // in order to protect Clickjacking, Formjacking, Data Exfiltration and more.
  // https://cspscanner.com/
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/child-src
  const childSrc = [
    'https://www.youtube.com/embed/',
    'https://www.youtube-nocookie.com/',
    'https://player.vimeo.com/video/'
  ];

  // I need to fetch images from Cloudinary and to POST analytics to my Ackee
  // instance.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src
  const connectSrc = [
    "'self'",
    'https://analytics.projects.giacomodebidda.com',
    'https://res.cloudinary.com'
  ];

  // I would like to use default-src: 'none', but prefetch-src is currently not
  // supported by any browser and it falls back to default-src. So I have no
  // choice, I cannot use default-src: 'none' because it would prevent me from
  // prefetching resources (which I am doing with instant.page.js).
  const defaultSrc = ["'self'"];

  // Allow only font files hosted on this origin (self-hosted). Since I am
  // self-hosting all my font files, I don't think there is any need to go
  // overboard and generate hashes to be included in the font-src directive.
  const fontSrc = ["'self'"];

  // Upon successful submission of the contact form in this website, the user is
  // redirected to a success page. For this to work I need to allow this origin.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/form-action
  const formAction = ["'self'"];

  // I am not sure I understand this directive, but I guess I don't need to
  // allow anything here.
  const frameAncestors = ["'none'"];

  // Allow iframes from YouTube, Vimeo.
  const frameSrc = [
    'https://www.youtube.com/embed/',
    'https://www.youtube-nocookie.com/',
    'https://player.vimeo.com/video/'
  ];

  // Allow images hosted on this origin and on my Cloudinary media library.
  const imgSrc = ["'self'", 'https://res.cloudinary.com/jackdbd/image/upload/'];

  // I guess the only reasonable configuration for this is 'self'. Where else
  // should I host my manifest.webmanifest?
  const manifestSrc = ["'self'"];

  // At the moment I have neither <audio> nor <video>.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/media-src
  const mediaSrc = ["'none'"];

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/navigate-to
  // const navigateTo = [];

  // This should always be set to 'none'
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/object-src
  const objectSrc = ["'none'"];

  // Still not supported by any browser, but it falls back to default-src.
  // That's why I set 'default-src' to 'self' instead of 'none'.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/prefetch-src
  const prefetchSrc = ["'self'"];

  // report-to: indicate a groupname that matches one of the groups defined in
  // the Report-To header (see netlify.toml).
  const reportTo = 'default';

  // send CSP violations to reporting service
  // Note: report-uri is a deprecated CSP directive, but I include it here
  // because Firefox does not yet support the report-to CSP directive, nor the
  // Report-To header.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/report-uri
  const reportUri = 'https://giacomodebidda.report-uri.com';

  // I don't fully understand what this directive is for.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/require-trusted-types-for
  // TODO: learn how to configure it
  // const requireTrustedTypesFor = ["'script'"];

  // No idea about this one.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/sandbox
  // const sandbox = [];

  const isScriptSrcElem = (res) => res.csp_directive === 'script-src-elem';
  const isStyleSrcAttr = (res) => res.csp_directive === 'style-src-attr';
  const isStyleSrcElem = (res) => res.csp_directive === 'style-src-elem';

  const sha256 = (res) => `'${res.sha256}'`;

  // Inline Javascript is a major attack vector for XSS attacks. It's better to
  // allow no inline scripts.
  const scriptSrcAttr = ["'none'"];

  const scriptSrcElem = [
    "'self'",
    ...resources.filter(isScriptSrcElem).map(sha256)
  ];

  // Unfortunately Firefox does not yet support the script-src-attr and
  // script-src-elem CSP directives, so we need to fallback to script-src
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1529337
  // 'unsafe-inline' is to be backward compatible with older browsers. It's
  // ignored by browsers supporting nonces/hashes.
  const scriptSrc = ["'unsafe-inline'", ...scriptSrcElem];

  // I don't know why, but Chrome refuses to apply these inline styles.
  // These hashes should be ok, and even Chrome itself suggests to use THESE
  // hashes. I guess I'll have to use 'unsafe-inline' for now.
  // const styleSrcAttr = [
  //   "'self'",
  //   ...resources.filter(isStyleSrcAttr).map(sha256)
  // ];
  const styleSrcAttr = ["'self'", "'unsafe-inline'"];

  const styleSrcElem = [
    "'self'",
    ...resources.filter(isStyleSrcElem).map(sha256)
  ];

  // Unfortunately Firefox does not yet support the style-src-attr and
  // style-src-elem CSP directives, so we need to fallback to style-src
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1529338
  const styleSrc = [...styleSrcAttr, ...styleSrcElem];

  // I guess I don't need to create Trusted Types policies for now. I'm setting
  // this to 'none' to see when it breaks.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/trusted-types
  // const trustedTypes = ["'none'"];

  // I guess I don't really need to configure this directive since this is a
  // HTTPS-only website, but I it shouldn't hurt setting it to true.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/upgrade-insecure-requests
  const upgradeInsecureRequests = true;

  // I have a service worker on this origin and probably will have some web
  // workers in the future.
  // I guess setting 'worker-src': 'none' could be a useful kill-switch for a
  // buggy service worker: it would prevent the browser from loading the worker.
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/worker-src
  const workerSrc = ["'self'"];

  return cspBuilder({
    directives: {
      'base-uri': baseUri,
      'child-src': childSrc,
      'connect-src': connectSrc,
      'default-src': defaultSrc,
      'font-src': fontSrc,
      'form-action': formAction,
      'frame-ancestors': frameAncestors,
      'frame-src': frameSrc,
      'img-src': imgSrc,
      'manifest-src': manifestSrc,
      'media-src': mediaSrc,
      // 'navigate-to': navigateTo,
      'object-src': objectSrc,
      'prefetch-src': prefetchSrc,
      'report-to': reportTo,
      'report-uri': reportUri,
      // 'require-trusted-types-for': requireTrustedTypesFor,
      'script-src': scriptSrc,
      'script-src-attr': scriptSrcAttr,
      'script-src-elem': scriptSrcElem,
      'style-src': styleSrc,
      'style-src-attr': styleSrcAttr,
      'style-src-elem': styleSrcElem,
      // 'trusted-types': trustedTypes,
      'upgrade-insecure-requests': upgradeInsecureRequests,
      'worker-src': workerSrc
    }
  });
};

const contentSecurityPolicyFromJSON = async (filepath) => {
  try {
    const json = await readFileAsync(filepath);
    return contentSecurityPolicy(JSON.parse(json));
  } catch (err) {
    throw err;
  }
};

module.exports = {
  contentSecurityPolicy,
  contentSecurityPolicyFromJSON
};
