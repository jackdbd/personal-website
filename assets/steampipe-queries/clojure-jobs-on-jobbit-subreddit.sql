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
  and query = '(title:"[hiring]" OR flair:Hiring) (selftext:"clojure") AND (selftext:"remote")'
order by
  created_utc desc,
  rank desc
limit
  30;
