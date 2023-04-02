# Hacker News scripts

## Search

Perform searches on Hacker News using the [Steampipe LinkedIn plugin](https://hub.steampipe.io/plugins/turbot/hackernews).

```sh
node scripts/hacker-news/job-links.cjs
```

You can trigger a GitHub workflow manually using the GitHub CLI:

```sh
gh workflow run "Hacker News links to Telegram"
```

Retrieve the item ID of the Hacker News story `Ask HN: Freelancer? Seeking freelancer?` posted by user `whoishiring`:

```sh
# posted this month (there might not be one yet)
node scripts/hacker-news/whoishiring-item-id.cjs
# posted in March 2023
node scripts/hacker-news/whoishiring-item-id.cjs 'March 2023'
```

## Post on Hacker News

Post ad on ASK HN: Freelancer? Looking for work?

```sh
node scripts/hacker-news/post-ad-on-ask-hn-seeking-freelancer.cjs 34983766
```

You can trigger a GitHub workflow manually using the GitHub CLI:

```sh
gh workflow run "Ask HN Freelancer? Seeking Freelancer? (by whoishiring)"
```