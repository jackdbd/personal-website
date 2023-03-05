-- ChatGPT models
-- https://platform.openai.com/docs/models/gpt-3-5
-- https://platform.openai.com/docs/api-reference/completions/create
select
  completion
from
  openai_completion
where
  settings = '{
    "model": "text-davinci-003",
    "max_tokens": 100
  }'
  and prompt = 'Write me a haiku about a cat.
';