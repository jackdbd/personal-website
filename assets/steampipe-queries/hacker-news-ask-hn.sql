select
  t.by,
  t.id,
  t.score,
  t.time,
  t.title,
  concat('https://news.ycombinator.com/item?id=',t.id) as url
from
  hackernews_ask_hn as t
where
  t.type = 'story'
  and t.time > now() - interval '2 weeks'
order by
  t.score desc;
