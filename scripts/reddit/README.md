# Reddit scripts

## Search Reddit for keywords

Search a list of subreddits for posts containing one of the specified keywords:

```sh
node scripts/reddit/search.cjs \
  --subreddits 'learnmachinelearning,machinelearning,openassistant' \
  --keywords 'bard,chatgpt,chroma,embedding'
```

Note: the [Steampipe Reddit plugin](https://hub.steampipe.io/plugins/turbot/reddit) seems **not** to allow searches across all Reddit. That's why I'm using [snoowrap](https://github.com/not-an-aardvark/snoowrap) for this script.

You can also run this script from a GitHub workflow. For example, using the [GitHub CLI](https://cli.github.com/):

```sh
gh workflow run "Reddit search"
```

## Post freelancing ad on various Reddit

🧪 Post the ad [reddit-freelancing.md](../../assets/ads/reddit-freelancing.md) to [r/test](https://www.reddit.com/r/test/):

```sh
node scripts/reddit/post-ad-freelancing.cjs --subreddit test
```

⚠️ Post the ad [reddit-freelancing.md](../../assets/ads/reddit-website-audit.md) to various subreddits:

```sh
node scripts/reddit/post-ad-freelancing.cjs --subreddit forhire
node scripts/reddit/post-ad-freelancing.cjs --subreddit jobbit
```

You can also run this script from a GitHub workflow:

```sh
gh workflow run "Reddit freelancing"
```
### r/ForHire

Things to keep in mind when posting on [r/ForHire](https://www.reddit.com/r/ForHire/):

- You cannot offer to work for free.
- You mist always indicate budgets or rates. A ballpark estimate is also fine.
- Max 1 post per week.
- This subreddit is for single freelancers. Web agencies should post on [r/B2BForHire](https://www.reddit.com/r/B2BForHire/).

See also: [rules of r/forhire](https://www.reddit.com/r/forhire/comments/44aeko/rules_guidelines_read_before_posting/).

### r/jobbit

Things to keep in mind when posting on [r/jobbit](https://www.reddit.com/r/jobbit/):

- It seems r/jobbit has no rules at the moment.

## Post website audit ad on various subreddits

### r/slavelabour

Things to keep in mind when posting on [r/slavelabour](https://www.reddit.com/r/slavelabour/):

- Max 1 post every 3 days.
- Title must contain the flair `[OFFER]` if you are offering a service, or `[TASK]` if you are requesting a service.

See also: [rules of r/slavelabour](https://www.reddit.com/r/slavelabour/wiki/rules/).

🧪 Post the ad [reddit-website-audit.md](../../assets/ads/reddit-website-audit.md) to [r/test](https://www.reddit.com/r/test/):

```sh
node scripts/reddit/post-ad-website-audit.cjs \
  --cta-md '[ORDER NOW](https://buy.stripe.com/6oE6oM6di9YA5eE005?prefilled_promo_code=REDDITSLAVELABOUR80)' \
  --test
```

⚠️ Post the ad [reddit-website-audit.md](../../assets/ads/reddit-website-audit.md) to [r/slavelabour](https://www.reddit.com/r/slavelabour/):

```sh
node scripts/reddit/post-ad-website-audit.cjs \
  --cta-md '[ORDER NOW](https://buy.stripe.com/6oE6oM6di9YA5eE005?prefilled_promo_code=REDDITSLAVELABOUR80)'
```

Note: the `--cta-md` option is required because I want to use different [Stripe promotion codes](https://stripe.com/docs/api/promotion_codes) for different subreddits and/or periods of the year, and because I want to experiment with different call to actions.

I created a GitHub workflow for this, but I still haven't decided whether I want to use it or not:

```sh
gh workflow run "r/slavelabour Website Audit"
```

### r/smallbusiness

Things to keep in mind when posting on [r/smallbusiness](https://www.reddit.com/r/smallbusiness/):

- No business promotion posts are allowed outside of the weekly **Promote-your-business** thread.

🧪 Post the ad [reddit-smallbusiness.md](../../assets/ads/reddit-smallbusiness.md) on [r/test](https://www.reddit.com/r/test/):

```sh
node scripts/reddit/post-ad-smallbusiness.cjs \
  --cta-md '[ORDER NOW TO GET 50% OFF](https://buy.stripe.com/6oE6oM6di9YA5eE005?prefilled_promo_code=REDDITSMALLBUSINESS50)' \
  --test
```

⚠️ Post the ad [reddit-smallbusiness.md](../../assets/ads/reddit-website-audit.md) to [r/smallbusiness](https://www.reddit.com/r/smallbusiness/):

```sh
node scripts/reddit/post-ad-smallbusiness.cjs \
  --cta-md '[ORDER NOW TO GET 50% OFF](https://buy.stripe.com/6oE6oM6di9YA5eE005?prefilled_promo_code=REDDITSMALLBUSINESS50)'
```
