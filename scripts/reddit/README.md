# Reddit scripts

Scripts that I use to search and post stuff on Reddit.

- [reddit search docs entry point](https://support.reddithelp.com/hc/en-us/sections/19695543476884-Search)
- [GET /r/{subreddit}/search](https://www.reddit.com/dev/api#GET_search)

As far as I know, search queries are always [case insensitive](https://www.reddit.com/r/help/comments/5ubsrk/case_sensitive_search/) on Reddit.

## Search Reddit for jobs

Example: find remote React jobs posted in r/jobbit or r/reactjs this week.

```sh
node scripts/reddit/search.cjs \
  --description 'Remote React jobs posted in r/jobbit or r/reactjs this week' \
  --query '(title:"[hiring]" OR flair:Hiring) AND (selftext:"remote" AND selftext:"react") AND (subreddit:jobbit OR subreddit:reactjs)' \
  -t 'week'
```

Example: find jobs mentioning "GCP" in various subreddits this month.

```sh
node scripts/reddit/search.cjs \
  -d 'Jobs mentioning "GCP" in various subreddits this month' \
  -q '(selftext:"GCP") AND (subreddit:b2bforhire OR subreddit:r/forhire OR subreddit:freelance OR subreddit:indiebiz OR subreddit:jobbit OR subreddit:r/slavelabor) AND NOT (title:"[For Hire]" OR title:"[Hire Me]")' \
  -t 'month'
```

## Search Reddit for keywords

Search a list of subreddits for posts containing any of the specified keywords, either in the title of the post, or in its body.

Example: find posts about [LLMs](https://en.wikipedia.org/wiki/Large_language_model) and [vector databases](https://www.pinecone.io/learn/vector-database/) posted this week.

```sh
node scripts/reddit/search.cjs \
  --subreddits 'learnmachinelearning,machinelearning,openassistant' \
  --keywords 'bard,chatgpt,chroma,embedding' \
  --time 'week'
```

Example: discover interesting middlewares and plugins for CloudFlare Workers and CloudFlare Pages Functions posted this month.

```sh
node scripts/reddit/search.cjs \
  -d 'Middlewares and plugins for CloudFlare Workers and CloudFlare Pages Functions posted this month' \
  -k 'middleware,plugin,worker' \
  -s 'CloudFlare,JAMstack' \
  -t 'month'
```

Example (WIP): find leads for website audits.

```sh
node scripts/reddit/search.cjs \
  -d 'Find out whether someone is complaining about having a slow website' \
  -k 'audit,web performance,slow website' \
  -s 'advancedentrepreneur,eCommerce,SaaS,smallbusiness' \
  -t 'month'
```

Example: find out if anyone has ever talked about Elysia or Hono on any programming subreddit.

```sh
node scripts/reddit/search.cjs \
  -k 'elysia,hono' \
  -s 'bunjs,CloudFlare,DevTo,frontend,JAMstack,javascript,node,programming,reactjs,WebDev,Web_Performance' \
  -t 'all'
```

Note: the [Steampipe Reddit plugin](https://hub.steampipe.io/plugins/turbot/reddit) seems **not** to allow searches across all Reddit. That's why I'm using [snoowrap](https://github.com/not-an-aardvark/snoowrap) for this script.

You can also run this script from a GitHub workflow. For example, using the [GitHub CLI](https://cli.github.com/):

```sh
gh workflow run "Reddit search"
```

## Post freelancing ad on various subreddits

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
