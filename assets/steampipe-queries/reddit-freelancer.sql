select
  t.author,
  t.created_utc,
  t.selftext,
  t.title,
  t.url
from
  reddit_subreddit_post_search as t
where
-- subreddit = 'forhire'
  t.subreddit = 'freelance'
-- subreddit = 'remotejs'
  and t.created_utc > now() - interval '1 month'
  -- and t.query = '(selftext:"contract" OR selftext:"invoic")'
  and t.query = '(selftext:"audit")'
order by
  t.created_utc desc,
  t.rank desc
limit
  30;
