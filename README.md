# My personal website

![Security Headers](https://img.shields.io/security-headers?url=https%3A%2F%2Fwww.giacomodebidda.com%2F)
![Chromium HSTS preload](https://img.shields.io/hsts/preload/giacomodebidda.com)
[![CI](https://github.com/jackdbd/personal-website/actions/workflows/ci.yaml/badge.svg)](https://github.com/jackdbd/personal-website/actions/workflows/ci.yaml)

My personal website and blog, built with [11ty](https://www.11ty.dev/) and [Workbox](https://github.com/googlechrome/workbox). Hosted on [Cloudflare Pages](https://pages.cloudflare.com/).

## Features

- PWA with [web application manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- RSS feed with [@11ty/eleventy-plugin-rss](https://www.11ty.dev/docs/plugins/rss/)
- `sitemap.xml` and `robots.txt`
- `security.txt` in `.well-known` directory
- just-in-time preloading with [instant.page](https://instant.page/)
- Service worker generated with [workbox-core](https://developer.chrome.com/docs/workbox/modules/workbox-core/) and [esbuild](https://github.com/evanw/esbuild)
- contact form submission with a function deployed to Cloudflare Pages Functions (see the `functions/` directory)
- Performance reports with multiple [performance budgets](https://www.afasterweb.com/2020/01/28/performance-budgets-with-lighthouse/) using the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) and [webhint](https://github.com/webhintio/hint)
- Run Lighthouse every commit thanks to the [Lightouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- CSS on the critical path is inlined in the `<head>` and minified with [clean-css](https://www.11ty.dev/docs/quicktips/inline-css/). All other CSS is managed by [PostCSS](https://github.com/postcss/postcss)
- [Custom HTTP headers](https://developers.cloudflare.com/pages/how-to/add-custom-http-headers/) for the [Reporting API](https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API):
  - [Report-To](https://developers.google.com/web/updates/2018/09/reportingapi#header) with [Report URI](https://report-uri.com/)
  - [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
  - [Network Error Logging](https://developer.cdn.mozilla.net/en-US/docs/Web/HTTP/Headers/NEL)
  - [Permissions-Policy](https://scotthelme.co.uk/goodbye-feature-policy-and-hello-permissions-policy/)

You could also generate a Permission-Policy header with this website: https://www.permissionspolicy.com/

## Installation

Install all dependencies:

```shell
npm install
```

If you dont't already have it, install [zx](https://github.com/google/zx) globally:

```sh
npm i -g zx
```

## Development

Watch all templates, CSS, JS, service worker, and automatically refresh the browser using [BrowserSync](https://github.com/Browsersync/browser-sync):

```shell
npm run dev
```

Then visit http://localhost:8080/ to see the website.

In alternative, develop and preview locally the site with [wrangler](https://developers.cloudflare.com/pages/platform/functions/#develop-and-preview-locally) (this is useful when developing functions that will be deployed to [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)):

```sh
npm run wrangler
```

## Production

Build all templates, CSS, JS and the service worker (all minified):

```shell
npm run build
```

## Deploy

Just push to the remote repository. Cloudflare Pages takes care of deploying the `main` branch to production, and creates a [preview deployment](https://developers.cloudflare.com/pages/platform/preview-deployments/) for all other branches (e.g. `develop`).

## Security audit

Check the `Content-Security-Policy` and the other security headers with these online tools:

- https://observatory.mozilla.org/
- https://securityheaders.com/
- https://csp-evaluator.withgoogle.com/

## Troubleshooting the service worker

When developing, open Chrome DevTools, go to `Application > Service Workers` and check that:

- `Update on reload` is **enabled**. This ensures that the latest service worker will be **installed** and **activated** on the page.
- `Bypass for network` is **disabled**. This ensures that the route matchers, route handlers and runtime caches of the service worker will be used.
