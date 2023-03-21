select
  t.headline,
  t.id,
  t.rank,
  t.subline,
  t.title
from
  linkedin_search_company as t
where
  -- t.query = 'alpitour'
  t.query = '%marketing%'
  -- t.query = 'web agency'
  -- t.query = 'web performance'
limit
  25;
