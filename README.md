# personal-website

<!-- Do NOT edit this file manually. Instead, re-run `npm run readme`. -->

[![HSTS preload](https://img.shields.io/hsts/preload/giacomodebidda.com)](https://hstspreload.org/?domain=giacomodebidda.com)
[![HSTS preload](https://github.com/jackdbd/personal-website/actions/workflows/ci.yaml/badge.svg)](https://github.com/jackdbd/personal-website/actions/workflows/ci.yaml)
[![HSTS preload](https://github.com/jackdbd/personal-website/actions/workflows/cloudflare-pages-deploy-hook.yaml/badge.svg)](https://github.com/jackdbd/personal-website/actions/workflows/cloudflare-pages-deploy-hook.yaml)

My personal website and blog, built with [11ty](https://www.11ty.dev/) and [Workbox](https://github.com/googlechrome/workbox). Hosted on [Cloudflare Pages](https://pages.cloudflare.com/).

- [Features](#features)
- [Installation](#installation)
- [Development](#development)
  - [Test the production build locally](#test-the-production-build-locally)
- [Deploy](#deploy)
- [Security](#security)
  - [Run a security audit on the HTTP headers](#run-a-security-audit-on-the-http-headers)
  - [Security policy](#security-policy)
- [Dependencies](#dependencies)
  - [Production dependencies](#production-dependencies)
  - [Development dependencies](#development-dependencies)
- [Troubleshooting](#troubleshooting)
  - [Troubleshooting the service worker](#troubleshooting-the-service-worker)
- [License](#license)

## Features

<!-- - PWA with  [web application manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- RSS feed with [`@11ty/eleventy-plugin-rss`](https://www.11ty.dev/docs/plugins/rss/) -->

- PWA with [web application manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- RSS feed with [@11ty/eleventy-plugin-rss](https://www.11ty.dev/docs/plugins/rss/)
- [webmentions](https://indieweb.org/Webmention) sent to [Webmention.io](https://webmention.io/) and collected by [Bridgy](https://brid.gy)
- [WebC](https://www.11ty.dev/docs/languages/webc/) component to send webmentions using a Progressive Enhancement friendly HTML form
- `sitemap.xml` and `robots.txt` for SEO
- `security.txt` in `.well-known` directory
- just-in-time preloading with [instant.page](https://instant.page/)
- Service worker generated with [workbox-core](https://developer.chrome.com/docs/workbox/modules/workbox-core/) and [esbuild](https://github.com/evanw/esbuild)
- Modular type scale and fluid space system thanks to [Utopia](https://utopia.fyi/)
- Performance reports with multiple [performance budgets](https://www.afasterweb.com/2020/01/28/performance-budgets-with-lighthouse/) using the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) and [webhint](https://github.com/webhintio/hint)
- HTML minified using [html-minifier-terser](https://github.com/terser/html-minifier-terser) (only when building for production)
- CSS on the critical path minified with [clean-css](https://www.11ty.dev/docs/quicktips/inline-css/) and inlined in the `<head>`. All other CSS is managed by [PostCSS](https://github.com/postcss/postcss).
- Embeds for YouTube and Video thanks to [eleventy-plugin-youtube-embed](https://github.com/gfscott/eleventy-plugin-embed-everything/tree/main/packages/youtube) and [eleventy-plugin-vimeo-embed](https://github.com/gfscott/eleventy-plugin-embed-everything/tree/main/packages/vimeo)
- Framework agnostic partial hydration with [@11ty/is-land](https://github.com/11ty/is-land)
- [Custom HTTP headers](https://developers.cloudflare.com/pages/how-to/add-custom-http-headers/) for the [Reporting API](https://developer.mozilla.org/en-US/docs/Web/API/Reporting_API):
  - [Report-To](https://developers.google.com/web/updates/2018/09/reportingapi#header) and [Reporting-Endpoints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Reporting-Endpoints)
  - [Content-Security-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
  - [Network Error Logging](https://developer.cdn.mozilla.net/en-US/docs/Web/HTTP/Headers/NEL)
  - [Permissions-Policy](https://scotthelme.co.uk/goodbye-feature-policy-and-hello-permissions-policy/)
- Configurable text to speech synthesis, thanks to [@jackdbd/eleventy-plugin-text-to-speech](https://github.com/jackdbd/undici/tree/main/packages/eleventy-plugin-text-to-speech)
- [Scripts](./scripts/README.md) I use for various administrative tasks

## Installation

Clone the repo:

```shell
git clone git@github.com:jackdbd/personal-website.git
```

This project should work on Node.js >=20.0.0.

> :information_source: **What's that `devenv.nix`?**
>
> This project uses [devenv](https://devenv.sh/) to create and manage a developer environment that has all the necessary dependencies. Thanks to [devenv's automatic shell activation](https://devenv.sh/automatic-shell-activation/), this environment is activated automatically when you enter the root directory of this repository (you will just have to wait a few seconds).
>
> If you don't use Nix, you can safely ignore the `devenv.nix` file in the repository root.
>
> In alternative to the Nix dev shell provided by this repository, you could use a Node.js version manager like [nvm](https://github.com/nvm-sh/nvm), [asdf](https://github.com/asdf-vm/asdf), or [volta](https://github.com/volta-cli/volta).

If you want to run scrips/tests that rely on [Playwright](https://playwright.dev/), you will also need to install/update the browsers it uses:

```sh
npx playwright install
```

## Development

Watch all templates, CSS, JS, and automatically refresh the browser:

```sh
npm run dev
```

Go to http://localhost:8080/ to visit the website.

In alternative, develop and preview the site with [wrangler](https://developers.cloudflare.com/pages/platform/functions/#develop-and-preview-locally) (this is useful when developing functions that will be deployed to [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)):

```sh
npm run wrangler
```

Go to http://localhost:8788/ to visit the website.

### Test the production build locally

Build all templates, CSS, JS, `_headers` file and the service worker:

```sh
npm run build
```

Serve the production build:

```sh
npm run site:serve
```

## Deploy

Just push to the remote repository. [This GitHub workflow](./.github/workflows/ci.yaml) will automatically deploy the website to Cloudflare Pages.

- Each push on the `main` branch will trigger a production deployment.
- Each push on any other branch will trigger a [preview deployment](https://developers.cloudflare.com/pages/platform/preview-deployments/).

> :warning: **Node.js version on Cloudflare Pages**
>
> Don't forget to set the environment variables `NODE_ENV` and `NODE_VERSION` in the [Cloudflare Pages dashboard](https://developers.cloudflare.com/pages/functions/bindings/#environment-variables). In particular, `NODE_VERSION` is used by the [Cloudflare Pages V2 build system](https://developers.cloudflare.com/pages/configuration/language-support-and-tools/#v2-build-system).

## Security

### Run a security audit on the HTTP headers

Generate the `_headers` file which will be used by Cloudflare Pages:

```sh
node scripts/headers.mjs
```

Check the `Content-Security-Policy` and the other security headers with these online tools:

- https://observatory.mozilla.org/
- https://securityheaders.com/
- https://csp-evaluator.withgoogle.com/

### Security policy

See [SECURITY.md](./SECURITY.md).

## Dependencies

### Production dependencies

This project has **52** `dependencies`.

| Package | Version |
|---|---|
| [@11ty/eleventy](https://www.npmjs.com/package/@11ty/eleventy) | `^3.0.0` |
| [@11ty/eleventy-fetch](https://www.npmjs.com/package/@11ty/eleventy-fetch) | `^4.0.1` |
| [@11ty/eleventy-navigation](https://www.npmjs.com/package/@11ty/eleventy-navigation) | `^0.3.5` |
| [@11ty/eleventy-plugin-rss](https://www.npmjs.com/package/@11ty/eleventy-plugin-rss) | `^2.0.2` |
| [@11ty/eleventy-plugin-syntaxhighlight](https://www.npmjs.com/package/@11ty/eleventy-plugin-syntaxhighlight) | `^5.0.0` |
| [@11ty/eleventy-plugin-webc](https://www.npmjs.com/package/@11ty/eleventy-plugin-webc) | `^0.11.2` |
| [@11ty/is-land](https://www.npmjs.com/package/@11ty/is-land) | `^4.0.0` |
| [@google-cloud/storage](https://www.npmjs.com/package/@google-cloud/storage) | `^7.13.0` |
| [@google-cloud/text-to-speech](https://www.npmjs.com/package/@google-cloud/text-to-speech) | `^5.5.0` |
| [@jackdbd/content-security-policy](https://www.npmjs.com/package/@jackdbd/content-security-policy) | `^3.0.0` |
| [@jackdbd/eleventy-plugin-ensure-env-vars](https://www.npmjs.com/package/@jackdbd/eleventy-plugin-ensure-env-vars) | `^1.2.0` |
| [@jackdbd/eleventy-plugin-telegram](https://www.npmjs.com/package/@jackdbd/eleventy-plugin-telegram) | `^2.2.0` |
| [@jackdbd/eleventy-plugin-text-to-speech](https://www.npmjs.com/package/@jackdbd/eleventy-plugin-text-to-speech) | `^3.2.0` |
| [@jackdbd/hosting-utils](https://www.npmjs.com/package/@jackdbd/hosting-utils) | `^1.0.0` |
| [@jackdbd/permissions-policy](https://www.npmjs.com/package/@jackdbd/permissions-policy) | `^1.0.0` |
| [@thi.ng/transclude](https://www.npmjs.com/package/@thi.ng/transclude) | `^0.1.108` |
| [autoprefixer](https://www.npmjs.com/package/autoprefixer) | `^10.4.20` |
| [clean-css](https://www.npmjs.com/package/clean-css) | `^5.3.3` |
| [cloudinary](https://www.npmjs.com/package/cloudinary) | `^2.5.1` |
| [cssnano](https://www.npmjs.com/package/cssnano) | `^7.0.6` |
| [debug](https://www.npmjs.com/package/debug) | `^4.3.7` |
| [eleventy-plugin-embed-cloudinary](https://www.npmjs.com/package/eleventy-plugin-embed-cloudinary) | `^1.0.2` |
| [eleventy-plugin-embed-twitter](https://www.npmjs.com/package/eleventy-plugin-embed-twitter) | `^1.4.1` |
| [eleventy-plugin-emoji](https://www.npmjs.com/package/eleventy-plugin-emoji) | `^1.1.0` |
| [eleventy-plugin-helmet](https://www.npmjs.com/package/eleventy-plugin-helmet) | `^0.2.2` |
| [eleventy-plugin-nesting-toc](https://www.npmjs.com/package/eleventy-plugin-nesting-toc) | `^1.3.0` |
| [eleventy-plugin-reading-time](https://www.npmjs.com/package/eleventy-plugin-reading-time) | `^0.0.1` |
| [eleventy-plugin-vimeo-embed](https://www.npmjs.com/package/eleventy-plugin-vimeo-embed) | `^1.3.8` |
| [eleventy-plugin-youtube-embed](https://www.npmjs.com/package/eleventy-plugin-youtube-embed) | `^1.11.0` |
| [esbuild](https://www.npmjs.com/package/esbuild) | `^0.24.0` |
| [globby](https://www.npmjs.com/package/globby) | `^14.0.2` |
| [html-minifier-terser](https://www.npmjs.com/package/html-minifier-terser) | `^7.2.0` |
| [instant.page](https://www.npmjs.com/package/instant.page) | `^5.2.0` |
| [luxon](https://www.npmjs.com/package/luxon) | `^3.5.0` |
| [markdown-it](https://www.npmjs.com/package/markdown-it) | `^14.1.0` |
| [markdown-it-anchor](https://www.npmjs.com/package/markdown-it-anchor) | `^9.2.0` |
| [npm-run-all](https://www.npmjs.com/package/npm-run-all) | `^4.1.5` |
| [pagefind](https://www.npmjs.com/package/pagefind) | `^1.1.1` |
| [postcss](https://www.npmjs.com/package/postcss) | `^8.4.47` |
| [postcss-cli](https://www.npmjs.com/package/postcss-cli) | `^11.0.0` |
| [sanitize-html](https://www.npmjs.com/package/sanitize-html) | `^2.13.1` |
| [slugify](https://www.npmjs.com/package/slugify) | `^1.6.6` |
| [stripe](https://www.npmjs.com/package/stripe) | `^17.2.1` |
| [tailwindcss](https://www.npmjs.com/package/tailwindcss) | `^3.4.14` |
| [terser](https://www.npmjs.com/package/terser) | `^5.36.0` |
| [tsm](https://www.npmjs.com/package/tsm) | `^2.3.0` |
| [workbox-build](https://www.npmjs.com/package/workbox-build) | `^7.1.1` |
| [workbox-core](https://www.npmjs.com/package/workbox-core) | `^7.1.0` |
| [workbox-expiration](https://www.npmjs.com/package/workbox-expiration) | `^7.1.0` |
| [workbox-precaching](https://www.npmjs.com/package/workbox-precaching) | `^7.1.0` |
| [workbox-routing](https://www.npmjs.com/package/workbox-routing) | `^7.1.0` |
| [zod](https://www.npmjs.com/package/zod) | `^3.23.8` |

### Development dependencies

This project has **19** `devDependencies`: [@hint/hint-performance-budget](https://www.npmjs.com/package/@hint/hint-performance-budget), [@jackdbd/checks](https://www.npmjs.com/package/@jackdbd/checks), [@types/yargs](https://www.npmjs.com/package/@types/yargs), [form-data](https://www.npmjs.com/package/form-data), [himalaya](https://www.npmjs.com/package/himalaya), [hint](https://www.npmjs.com/package/hint), [lighthouse](https://www.npmjs.com/package/lighthouse), [linkedin-api-client](https://www.npmjs.com/package/linkedin-api-client), [openpgp](https://www.npmjs.com/package/openpgp), [playwright-chromium](https://www.npmjs.com/package/playwright-chromium), [playwright-start](https://www.npmjs.com/package/playwright-start), [prettier-plugin-tailwindcss](https://www.npmjs.com/package/prettier-plugin-tailwindcss), [pretty-error](https://www.npmjs.com/package/pretty-error), [serve](https://www.npmjs.com/package/serve), [snoowrap](https://www.npmjs.com/package/snoowrap), [taze](https://www.npmjs.com/package/taze), [typescript](https://www.npmjs.com/package/typescript), [uuid](https://www.npmjs.com/package/uuid), [yargs](https://www.npmjs.com/package/yargs).

## Troubleshooting

### Troubleshooting the service worker

When developing, open Chrome DevTools, go to `Application > Service Workers` and check that:

- `Update on reload` is **enabled**. This ensures that the latest service worker will be **installed** and **activated** on the page.
- `Bypass for network` is **disabled**. This ensures that the route matchers, route handlers and runtime caches of the service worker will be used.

## License

&copy; 2020 - 2024 [Giacomo Debidda](https://www.giacomodebidda.com/) // [MIT License](https://spdx.org/licenses/MIT.html)
