# HackerNews scripts

## Searches

Perform searches on Hacker News using the [Steampipe LinkedIn plugin](https://hub.steampipe.io/plugins/turbot/hackernews).

Search jobs:

```sh
node scripts/hacker-news/job-links.cjs
```

You can trigger this workflow manually using the GitHub CLI:

```sh
gh workflow run "Hacker News links to Telegram"
```
