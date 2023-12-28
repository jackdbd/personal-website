# scripts

Miscellaneous scripts I use for various tasks:

- [Manage my Stripe account](./stripe/README.md)
- [Search and post on various subreddits](./reddit/README.md)
- [Search and post on Hacker News](./hacker-news/README.md)
- [Search companies and people on LinkedIn](./linkedin/README.md)

All scripts should be launched from the repo root.

Most of these scripts include a help. To show the help, run the script with `--help` if it's a JS script, and `--info` if it's a TS script (I had to use `--info` instead of `--help` so it doesn't conflict with the help of the `tsm` command). For example:

```sh
node ./scripts/hacker-news/job-links.cjs --help
npx tsm ./scripts/stripe/archive-promotion-codes.ts --info
```

Some script post ads on various websites. The ads are kept in the [assets/ads](../assets/ads) directory. Every once in a while, double check that the ads are up to date.
