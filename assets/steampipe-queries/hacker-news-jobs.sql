select
  t.title,
  concat('https://news.ycombinator.com/item?id=',t.id) as url
from
  hackernews_job as t
where
  t.time > now() - interval '2 weeks'
limit
  50;
