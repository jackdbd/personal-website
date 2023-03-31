# Reddit scripts

> :bulb: Use `--test` to post the ad on [r/test](https://www.reddit.com/r/test/) instead of the "production" subreddit (e.g. `r/slavelabour`, `r/smallbusiness`, etc).

## Search

Search a list of subreddits for posts containing one of the specified keywords:

```sh
node scripts/reddit/search.cjs
```

Note: the [Steampipe Reddit plugin](https://hub.steampipe.io/plugins/turbot/reddit) seems **not** to allow searches across all Reddit.

You can also run this script from a GitHub workflow. For example, using the [GitHub CLI](https://cli.github.com/):

```sh
gh workflow run "Reddit search"
```

## r/ForHire

Things to keep in mind when posting on [r/ForHire](https://www.reddit.com/r/ForHire/):

- You cannot offer to work for free.
- You mist always indicate budgets or rates. A ballpark estimate is also fine.
- Max 1 post per week.
- This subreddit is for single freelancers. Web agencies should post on [r/B2BForHire](https://www.reddit.com/r/B2BForHire/).

See also: [rules of r/forhire](https://www.reddit.com/r/forhire/comments/44aeko/rules_guidelines_read_before_posting/).

Post the ad [reddit-freelancing.md](../../assets/ads/reddit-freelancing.md) on [r/test](https://www.reddit.com/r/test/):

```sh
node scripts/reddit/post-ad-freelancing.cjs --test
```

You can also run this script from a GitHub workflow:

```sh
gh workflow run "r/ForHire freelancing"
```

## r/slavelabour

Things to keep in mind when posting on [r/slavelabour](https://www.reddit.com/r/slavelabour/):

- Max 1 post every 3 days.
- Title must contain the flair `[OFFER]` if you are offering a service, or `[TASK]` if you are requesting a service.

See also: [rules of r/slavelabour](https://www.reddit.com/r/slavelabour/wiki/rules/).

Post the ad [reddit-website-audit.md](../../assets/ads/reddit-website-audit.md) on [r/test](https://www.reddit.com/r/test/):

```sh
node scripts/reddit/post-ad-website-audit.cjs \
  --cta-md '[ORDER NOW](https://buy.stripe.com/test_eVaeXRasmdiOdtCg0V?prefilled_promo_code=REDDITSLAVELABOUR80)' \
  --test
```

## r/smallbusiness

Things to keep in mind when posting on [r/smallbusiness](https://www.reddit.com/r/smallbusiness/):

- No business promotion posts are allowed outside of the weekly **Promote-your-business** thread.

Post the ad [reddit-smallbusiness.md](../../assets/ads/reddit-smallbusiness.md) on [r/test](https://www.reddit.com/r/test/):

```sh
node scripts/reddit/post-ad-smallbusiness.cjs \
  --cta-md '[ORDER NOW TO GET 80% OFF](https://buy.stripe.com/test_eVaeXRasmdiOdtCg0V?prefilled_promo_code=REDDITSMALLBUSINESS80)' \
  --test
```
