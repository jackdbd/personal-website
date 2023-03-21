select
  t.by,
  t.score,
  t.text,
  t.time,
  t.title,
  t.url
from
  hackernews_job as t
where
  t.title like '% (YC %'
  and t.time > now() - interval '1 week'
order by
  t.score desc;
