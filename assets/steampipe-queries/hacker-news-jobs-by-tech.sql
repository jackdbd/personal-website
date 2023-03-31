select
  case
    when title ~* 'android' or text ~* 'android' then 'Android'
    when title ~* 'clojure' or text ~* 'clojure' then 'Clojure'
    when title ~* 'java' or text ~* 'java' then 'Java'
    when title ~* '\sjavaScript\s' or text ~* '\sjavaScript\s' or title ~* '\stypeScript\s' or text ~* '\stypeScript\s' then 'JS/TS'
    when title ~* 'kubernetes' or title ~* 'K8s' or text ~* 'kubernetes' or text ~* 'K8s' then 'Kubernetes'
    when title ~* 'php' or text ~* 'php' then 'PHP'
    when title ~* 'python' or text ~* 'python' then 'Python'
    when title ~* 'react' or text ~* 'react' then 'React'
    when title ~* 'rust' or text ~* 'rust' then 'Rust'
    when title ~* 'sql' or text ~* 'sql' then 'SQL'
    when title ~* 'YC ' then 'YC'
    when title ~* 'zig' or text ~* 'zig' then 'Zig'
    else 'Other'
  end as tech,
  count(*) as jobs
from
  hackernews_job
group by
  tech
order by
  jobs desc;
