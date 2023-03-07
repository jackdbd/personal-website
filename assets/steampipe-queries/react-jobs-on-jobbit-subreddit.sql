-- https://hub.steampipe.io/plugins/turbot/reddit/tables/reddit_subreddit_post_search
select
  author,
  created_utc,
  title,
  url
from
  reddit_subreddit_post_search
where
  subreddit = 'jobbit'
  and created_utc > now() - interval '1 week'
  and query = '(title:"[hiring]" OR flair:Hiring) AND (selftext:"remote") AND (selftext:"react")'
order by
  created_utc desc,
  rank desc
limit
  30;
