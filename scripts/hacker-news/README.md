# Hacker News scripts

Scripts that I use to search and post stuff on Hacker News.

> :warning: **Steampipe on NixOS**
>
> Some scripts use Steampipe and a [Steampipe](https://github.com/turbot/steampipe) plugin to run a query. As explained in [this issue](https://github.com/NixOS/nixpkgs/issues/215945), using Steampipe is a bit of a mess. The easiest way is to run it in Docker.

## Search

### Search jobs on HN

Look for jobs on Hacker News using the [Steampipe hackernews plugin](https://hub.steampipe.io/plugins/turbot/hackernews) and POST a list of links to a Telegram bot, that will send a message to a Telegram chat.

Example 1:

```sh
node scripts/hacker-news/job-links.mjs \
  -t "Hacker News Jobs" \
  -d 'Jobs posted on <a href="https://news.ycombinator.com/jobs">Hacker News Jobs</a> this week.' \
  -q 'hacker-news-jobs-this-week.sql'
```

Example 2:

```sh
node scripts/hacker-news/job-links.mjs \
  -t "Hacker News Jobs" \
  -d 'Jobs posted on HN in the last 2 weeks' \
  -q 'hacker-news-jobs.sql'
```

You can trigger [this GitHub workflow](../../.github/workflows/hn-links-to-telegram.yaml) manually using the GitHub CLI:

```sh
gh workflow run "Hacker News links to Telegram"
```

### Ask HN story ID

Retrieve the item ID of the Hacker News story `Ask HN: Freelancer? Seeking Freelancer?` posted by the [whoishiring](https://news.ycombinator.com/submitted?id=whoishiring) bot:

```sh
# posted this month (there might not be one yet)
node scripts/hacker-news/whoishiring-item-id.mjs
# posted in June 2023
node scripts/hacker-news/whoishiring-item-id.mjs 'June 2023'
```

## Post

### Post ad on ASK HN: Freelancer? Seeking Freelancer?

Post [this ad](../../assets/ads/ask-hn-freelancer.txt) on `ASK HN: Freelancer? Seeking Freelancer?`

You can run the script locally:

```sh
node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.mjs
```

Or you can trigger [this GitHub workflow](../../.github/workflows/ask-hn-freelancer.yaml) manually using the GitHub CLI:

```sh
gh workflow run 'Ask HN Freelancer? Seeking Freelancer? (by whoishiring)'
```

You can also see the status of the latest run of the workflow:

```sh
gh workflow view 'Ask HN Freelancer? Seeking Freelancer? (by whoishiring)'
```
