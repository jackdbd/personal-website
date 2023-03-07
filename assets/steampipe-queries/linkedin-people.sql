select
  t.headline,
  t.id,
  t.member_distance,
  t.navigation_url,
  t.subline,
  t.title
from
  linkedin_search_profile as t
where
  -- t.query = 'marketing'
  -- and t.member_distance not in ('SELF', 'DISTANCE_1')
  -- and lower(t.subline) ilike '%viareggio%'
  t.query = 'google cloud platform'
  and t.member_distance not in ('SELF', 'DISTANCE_1')
  and lower(t.subline) ilike '%milan%'
limit
  25;
