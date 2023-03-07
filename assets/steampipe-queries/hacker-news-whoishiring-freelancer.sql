select
  t.by,
  t.id,
  -- t.kids,
  t.score,
  t.time,
  t.title,
  t.url
from
  hackernews_ask_hn as t
where
  t.type = 'story'
  and t.by like '%whoishiring%'
  and t.time > now() - interval '1 month'
  and lower(t.title) ilike '%freelancer%';
