-- Replace all story prompts with the curated v2 set.
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Wraps in a transaction so it's all-or-nothing.

BEGIN;

DELETE FROM story_prompts;

INSERT INTO story_prompts (category, prompt_text) VALUES
  -- Childhood
  ('Childhood', 'What was your favorite meal growing up?'),
  ('Childhood', 'What games did you love to play as a child?'),
  ('Childhood', 'What was your home like when you were young?'),

  -- Family & Traditions
  ('Family & Traditions', 'Is there a special meal your family always made together?'),
  ('Family & Traditions', 'What is a funny moment you shared with someone in your family?'),
  ('Family & Traditions', 'Tell me about a trip you took with your family.'),

  -- Cultural Heritage
  ('Cultural Heritage', 'What is your favorite holiday or celebration?'),
  ('Cultural Heritage', 'What is your favorite time of year, and why?'),

  -- Recent Memories
  ('Recent Memories', 'Tell me about a trip you took recently.');

COMMIT;

-- Verify:
-- SELECT category, count(*) FROM story_prompts GROUP BY category ORDER BY category;
