select
  t.title,
  t.headline,
  t.navigation_url,
  t.id,
  t.member_distance,
  t.rank,
  t.subline,
  t.social_proof_text
from
  linkedin_search_profile as t
where
  t.query = 'CTO'
  -- and lower(t.subline) ilike '%viareggio%'
  -- and t.member_distance not in ('SELF', 'DISTANCE_1')
  and lower(t.subline) ilike '%milan%'
order by
  t.rank desc
limit
  10;
