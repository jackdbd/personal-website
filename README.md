# personal-website

![HSTS preload](https://img.shields.io/hsts/preload/giacomodebidda.com)
[![CI](https://github.com/jackdbd/personal-website/actions/workflows/ci.yaml/badge.svg)](https://github.com/jackdbd/personal-website/actions/workflows/ci.yaml)

My personal website and blog, built with [11ty](https://www.11ty.dev/) and [Workbox](https://github.com/googlechrome/workbox). Hosted on [Cloudflare Pages](https://pages.cloudflare.com/).

## Features

- PWA with [web application manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- RSS feed with [@11ty/eleventy-plugin-rss](https://www.11ty.dev/docs/plugins/rss/)
- [webmentions](https://indieweb.org/Webmention) sent to [Webmention.io](https://webmention.io/) and collected by [Bridgy](https://brid.gy)
- [WebC](https://www.11ty.dev/docs/languages/webc/) component to send webmentions using a Progressive Enhancement friendly HTML form
- `sitemap.xml` and `robots.txt` for SEO
- `security.txt` in `.well-known` directory
- just-in-time preloading with [instant.page](https://instant.page/)
- Service worker generated with [workbox-core](https://developer.chrome.com/docs/workbox/modules/workbox-core/) and [esbuild](https://github.com/evanw/esbuild)
- Modular type scale and fluid space system thanks to [Utopia](https://utopia.fyi/)
- Contact form submission with a function deployed to Cloudflare Pages Functions (see the `functions/` directory)
- Performance reports with multiple [performance budgets](https://www.afasterweb.com/2020/01/28/performance-budgets-with-lighthouse/) using the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) and [webhint](https://github.com/webhintio/hint)
- Lighthouse runs on every commit thanks to the [Lightouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- HTML minified using [html-minifier-terser](https://github.com/terser/html-minifier-terser) (only when building for production)
- CSS on the critical path minified with [clean-css](https://www.11ty.dev/docs/quicktips/inline-css/) and inlined in the `<head>`. All other CSS is managed by [PostCSS](https://github.com/postcss/postcss).
- Embeds for YouTube and Video thanks to [eleventy-plugin-youtube-embed](https://github.com/gfscott/eleventy-plugin-embed-everything/tree/main/packages/youtube) and [eleventy-plugin-vimeo-embed](https://github.com/gfscott/eleventy-plugin-embed-everything/tree/main/packages/vimeo)
- Framework agnostic partial hydration with [@11ty/is-land](https://github.com/11ty/is-land)
- [Custom HTTP headers](https://developers.cloudflare.com/pages/how-to/add-custom-http-headers/) for the [Reporting API](https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API):
  - [Report-To](https://developers.google.com/web/updates/2018/09/reportingapi#header) with [Report URI](https://report-uri.com/)
  - [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
  - [Network Error Logging](https://developer.cdn.mozilla.net/en-US/docs/Web/HTTP/Headers/NEL)
  - [Permissions-Policy](https://scotthelme.co.uk/goodbye-feature-policy-and-hello-permissions-policy/) (if you prefer you can generate this header on [permissionspolicy.com](https://www.permissionspolicy.com/))
- Configurable text to speech synthesis, thanks to [@jackdbd/eleventy-plugin-text-to-speech](https://github.com/jackdbd/undici/tree/main/packages/eleventy-plugin-text-to-speech)
- [Scripts](./scripts/README.md) I use for various administrative tasks

## Installation

Clone the repo:

```shell
git clone git@github.com:jackdbd/personal-website.git
```

This project uses a [nix dev shell](https://fasterthanli.me/series/building-a-rust-service-with-nix/part-10) to define a virtual environment with all the necessary dependencies. Thanks to nix, direnv and the `.envrc` file, you can activate this environment just by entering the root directory of this repository.

Install all dependencies from npm.js (by passing `--include dev` we can be sure that we are installing `devDependencies` even when `NODE_ENV` is set to `production`):

```sh
npm install --include dev --include prod
```

If you don't use nix, install [zx](https://github.com/google/zx) globally.

```sh
npm install --global zx
```

If you want to run scripts and tests (e.g. e2e tests with [Playwright](https://playwright.dev/)) you will need to install also the dev dependencies:

```sh
npm install --include=prod --include=dev
```

> :information_source: If you are using the Nix package manager, you can find a `flake.nix` in this repository. It was generated using [dev-templates](https://github.com/the-nix-way/dev-templates). If you don't use / don't know Nix, you can safely ignore that file.

## Development

Watch all templates, CSS, JS, service worker, and automatically refresh the browser:

```sh
npm run dev
```

Then visit http://localhost:8080/ to see the website.

In alternative, develop and preview locally the site with [wrangler](https://developers.cloudflare.com/pages/platform/functions/#develop-and-preview-locally) (this is useful when developing functions that will be deployed to [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)):

```sh
npm run wrangler
```

## Production

Build all templates, CSS, JS and the service worker (all minified):

```sh
npm run build
```

Serve the production build:

```sh
npm run site:serve
```

## Deploy

Just push to the remote repository. Cloudflare Pages will take care of deploying the `main` branch to production, and creating a [preview deployment](https://developers.cloudflare.com/pages/platform/preview-deployments/) for all other branches.

## Security audit

Check the `Content-Security-Policy` and the other security headers with these online tools:

- https://observatory.mozilla.org/
- https://securityheaders.com/
- https://csp-evaluator.withgoogle.com/

## Security policy

See [SECURITY.md](./SECURITY.md).

## Scripts

- [Lighthouse reports](./lighthouse/reports/README.md)
- [Misc. scripts](./scripts/README.md)

## Troubleshooting the service worker

When developing, open Chrome DevTools, go to `Application > Service Workers` and check that:

- `Update on reload` is **enabled**. This ensures that the latest service worker will be **installed** and **activated** on the page.
- `Bypass for network` is **disabled**. This ensures that the route matchers, route handlers and runtime caches of the service worker will be used.
