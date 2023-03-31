with stories as (
  select
    t.by,
    t.score,
    t.title,
    t.time,
    t.url
  from
    hackernews_best as t
)
select
  s.by as user,
  max(s.score) as max_score
from
  stories as s
where
  s.score > 50
group by
  s.by
order by
  max_score desc
limit
  25;
