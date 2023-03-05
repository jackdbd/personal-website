select
  t.by,
  -- t.id,
  -- t.parent, -- whoishiring post
  t.text,
  t.time
from
  hackernews_item as t
where
  t.type = 'comment'
  and t.id in (
    34986392,
    34986745,
    34987333,
    34986920,
    34986004,
    34998306,
    34989683,
    34991734,
    34992503,
    35040006
  ); -- some freelancers' post (they are in the `kids` column of the whoishiring query result)
