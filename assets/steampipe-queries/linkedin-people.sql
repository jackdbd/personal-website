select
  p.id,
  p.first_name,
  p.last_name,
  p.headline,
  j ->> 'companyName' as company_name,
  (j -> 'dateRange' -> 'start' -> 'year') :: int as start_year,
  (j -> 'dateRange' -> 'end' -> 'year') :: int as end_year,
  j ->> 'title' as title,
  j ->> 'description' as description
  s ->> 'name' as skill
from
  linkedin_profile as p,
  jsonb_array_elements(p.positions) as c,
  jsonb_array_elements(p.skills) as s
  jsonb_array_elements(c -> 'profilePositionInPositionGroup' -> 'elements') as j
where
  lower(p.headline) ilike '%ux%'
order by
  start_year desc;
limit
  25;
