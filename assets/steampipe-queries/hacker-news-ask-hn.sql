select
  t.by,
  t.id,
  -- t.kids,
  t.score,
  t.time,
  t.title,
  concat('https://news.ycombinator.com/item?id=',t.id) as url
from
  hackernews_ask_hn as t
where
  t.type = 'story'
  -- and t.by like '%whoishiring%'
  and t.time > now() - interval '2 weeks'
--   and lower(t.title) ilike '%freelancer%'
order by
  t.score desc;
