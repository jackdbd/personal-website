select
  t.author,
  t.created_utc,
  -- t.selftext,
  t.title,
  t.url
from
  reddit_subreddit_post_search as t
where
  t.subreddit = 'slavelabour'
  and t.created_utc > now() - interval '1 month'
  and t.query = '(title:"[OFFER]" OR title:[Offer] OR title:[offer]) AND (selftext:"Assistant" OR selftext:"assistant" selftext:"VA")'
  -- and t.query = '(title:"[TASK]" OR title:[Task] OR title:[task]) AND (selftext:"audit")'
  -- and t.query = '(title:"[TASK]" OR title:[Task] OR title:[task]) AND (selftext:"audit" OR selftext:"performance")'
order by
  t.created_utc desc,
  t.rank desc
limit
  30;
