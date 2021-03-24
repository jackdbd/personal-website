# My personal website

My personal website and blog, built with [11ty](https://www.11ty.dev/) and [Tailwind CSS](https://tailwindcss.com/), hosted on [Netlify](https://www.netlify.com/).

## Installation

Install all project dependencies.

```sh
npm install
```

This website is deployed on Netlify, so be sure to install the [Netlify CLI](https://cli.netlify.com/) globally:

```sh
npm install netlify-cli -g
```

## Common commands

Compile and watch all CSS files and Nunjucks templates:

```sh
npm run dev
```

Build all CSS files and templates:

```sh
npm run build
```

Otherwise simply run `npm run menu`, which uses [Node Task List](https://github.com/ruyadorno/ntl) to print all available npm scripts.

## Features

- Performance reports with multiple [performance budgets](https://www.afasterweb.com/2020/01/28/performance-budgets-with-lighthouse/) using the [Lighthouse CLI](https://github.com/GoogleChrome/lighthouse#using-the-node-cli) and [webhint](https://github.com/webhintio/hint).
- Run Lighthouse every commit thanks to the [Lighouse CI](https://github.com/GoogleChrome/lighthouse-ci).
- CSS on the critical path is inlined in the `<head>` and minified with [clean-css](https://www.11ty.dev/docs/quicktips/inline-css/). All other CSS is managed by Tailwind.
- Post-build HTML validation with [netlify-plugin-html-validate](https://github.com/oliverroick/netlify-plugin-html-validate) and [HTML-validate](https://html-validate.org/usage/index.html).
- Post-build accessiblity check with [netlify-plugin-a11y](https://github.com/netlify-labs/netlify-plugin-a11y).
