# steampipe queries

## Reference

- [Table hackernews_ask_hn](https://hub.steampipe.io/plugins/turbot/hackernews/tables/hackernews_ask_hn)
- [Table hackernews_job](https://hub.steampipe.io/plugins/turbot/hackernews/tables/hackernews_job)
- [Table linkedin_profile](https://hub.steampipe.io/plugins/turbot/linkedin/tables/linkedin_profile)
- [Table reddit_subreddit_post_search](https://hub.steampipe.io/plugins/turbot/reddit/tables/reddit_subreddit_post_search)

## How to use?

On my laptop, use the [steampipe CLI](https://steampipe.io/docs/reference/cli/overview):

```sh
steampipe query assets/steampipe-queries/linkedin-companies.sql --output json | jq
```

In a GitHub workflow, use the [official GitHub action setup steampipe](https://github.com/marketplace/actions/setup-steampipe), call a Node.js script that prints the output to stdout, then redirect the output to stdout:

```sh
node scripts/linkedin/linkedin-companies-links.cjs >> $GITHUB_ENV
```

## Examples

```sh
steampipe query assets/steampipe-queries/hacker-news-jobs.sql --output json | jq
```

```sh
steampipe query assets/steampipe-queries/hacker-news-ask-hn.sql --output json | jq
```

```sh
steampipe query assets/steampipe-queries/reddit-slavelabour.sql --output json | jq
```