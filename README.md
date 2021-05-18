# My personal website

[![Netlify Status](https://api.netlify.com/api/v1/badges/0842fe55-a9cb-484a-82d0-6a5c08b62d62/deploy-status)](https://app.netlify.com/sites/epic-benz-a3f006/deploys) ![Security Headers](https://img.shields.io/security-headers?url=https%3A%2F%2Fwww.giacomodebidda.com%2F) ![Chromium HSTS preload](https://img.shields.io/hsts/preload/giacomodebidda.com) [![CI](https://github.com/jackdbd/personal-website/actions/workflows/ci.yml/badge.svg)](https://github.com/jackdbd/personal-website/actions/workflows/ci.yml)

My personal website and blog, built with [11ty](https://www.11ty.dev/) and [Workbox](https://github.com/googlechrome/workbox). Hosted on [Netlify](https://www.netlify.com/).

## Features

- Autogenerated RSS feed and sitemap.
- just-in-time preloading with [instant.page](https://instant.page/)
- Service worker generated with [workbox-build](https://developers.google.com/web/tools/workbox/modules/workbox-build) (in development, open Chrome DevTools and enable `Update on reload` in `Application > Service Workers` to always have the latest service worker).
- Performance reports with multiple [performance budgets](https://www.afasterweb.com/2020/01/28/performance-budgets-with-lighthouse/) using the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) and [webhint](https://github.com/webhintio/hint).
- Run Lighthouse every commit thanks to the [Lighouse CI](https://github.com/GoogleChrome/lighthouse-ci).
- CSS on the critical path is inlined in the `<head>` and minified with [clean-css](https://www.11ty.dev/docs/quicktips/inline-css/). All other CSS is managed by PostCSS.
- Post-build HTML validation with [netlify-plugin-html-validate](https://github.com/oliverroick/netlify-plugin-html-validate) and [HTML-validate](https://html-validate.org/usage/index.html).
- Post-build accessiblity check with [netlify-plugin-a11y](https://github.com/netlify-labs/netlify-plugin-a11y).
- Detect vulnerable JS librarie with [netlify-plugin-is-website-vulnerable](https://github.com/erezrokah/netlify-plugin-is-website-vulnerable).
- [Custom headers](https://docs.netlify.com/routing/headers/#custom-headers) for the [Reporting API](https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API):
  - [Report-To](https://developers.google.com/web/updates/2018/09/reportingapi#header) with [Report URI](https://report-uri.com/)
  - [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) generated after every build with [netlify-plugin-csp-generator](https://github.com/MarcelloTheArcane/netlify-plugin-csp-generator).
  - [Network Error Logging](https://developer.cdn.mozilla.net/en-US/docs/Web/HTTP/Headers/NEL)
  - [Permissions-Policy](https://scotthelme.co.uk/goodbye-feature-policy-and-hello-permissions-policy/)

## Installation

Install all project dependencies.

```sh
npm install
```

This website is deployed on Netlify, so be sure to install the [Netlify CLI](https://cli.netlify.com/):

```sh
npm install netlify-cli -g
```

## Development

Launch [Netlify Dev](https://docs.netlify.com/cli/get-started/#netlify-dev), recompile Nunjucks templates, JS/CSS assets, watch workbox configuration, reload the browser and share a live development server with a single command:

```sh
npm run netlify:dev
```

*Note*: with Netlify Dev you can test your Netlify Functions, but I don't think it can handle Netlify Forms submissions (yet).

## Production

Build all pages, CSS files and the service worker (all minified):

```sh
npm run build
```

## Other commands

Some npm scripts in this repo have quite long names. Use [Node Task List](https://github.com/ruyadorno/ntl) to print all available npm scripts:

```sh
npm run menu
```

## Security audit

Check the Content-Security-Policy header with one of these online tools:

- https://cspscanner.com/
- https://observatory.mozilla.org/
- https://securityheaders.com/
- https://csp-evaluator.withgoogle.com/
