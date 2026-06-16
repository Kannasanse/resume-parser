-- Add topic column to question_library for sub-concept grouping and retrieval
alter table question_library add column if not exists topic text;

-- Composite index for two-pass topic-aware retrieval (topic-matched first, then skill/difficulty fill)
create index if not exists idx_question_library_topic
  on question_library (skill_tag, topic, difficulty)
  where is_approved = true;

-- Add skill + topic to self_test_answers for per-attempt analytics (optional, non-blocking)
alter table self_test_answers add column if not exists skill text;
alter table self_test_answers add column if not exists topic text;
