# scripts

Scripts I use for various tasks. Most of these scripts include a help. To show the help, run the script with `--help` if it's a JS script, and `--info` if it's a TS script (I had to use `--info` instead of `--help` so it doesn't conflict with the help of the `tsm` command). For example:

```sh
node ./scripts/hacker-news/job-links.mjs --help
npx tsm ./scripts/stripe/archive-promotion-codes.ts --info
```

Some script post ads on various websites. The ads are kept in the [assets/ads](../assets/ads) directory. Every once in a while, double check that the ads are up to date.

## Hacker News

See these scripts to [search and post on Hacker News](./hacker-news/README.md).

## Headers

Build the `_headers` file.

```sh
node scripts/headers.mjs
```

## OpenPGP keys

Export the OpenPGP public/private keys in ASCII armor format.

```sh
npx tsm scripts/export-openpgp-keys.ts
```

## Reddit

See these script to [search and post on various subreddits](./reddit/README.md).

## `security.txt`

Regenerate the `security.txt` file.

```sh
node ./scripts/security-txt.mjs
```

## Service Worker

Build the service worker (build the 11ty site and the `_headers` file first).

```sh
DEBUG=script:build-sw node scripts/build-sw.mjs
```

## Stripe

See these script to [manage my Stripe account](./stripe/README.md).
