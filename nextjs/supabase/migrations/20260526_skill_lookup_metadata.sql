-- ── Skill lookup, alias merging & topic metadata ─────────────────────────────

-- pg_trgm for similarity search (handles typos like "Reect" → "React")
create extension if not exists pg_trgm;

-- ── Extend skill_topics (created in 20260526_skill_topics.sql) ───────────────
alter table skill_topics
  add column if not exists source      text    not null default 'admin',
  add column if not exists usage_count integer not null default 0,
  add column if not exists slug        text;

-- Backfill slug from name
update skill_topics
  set slug = lower(regexp_replace(name, '[^a-z0-9]+', '-', 'gi'))
  where slug is null;

-- Unique on (skill_id, slug) for upserts — drop old name-unique if exists
do $$
begin
  alter table skill_topics add constraint skill_topics_skill_id_slug_key unique(skill_id, slug);
exception when duplicate_table or duplicate_object then null;
end$$;

-- ── Add topic_count to skills ─────────────────────────────────────────────────
alter table skills
  add column if not exists topic_count integer not null default 0;

-- ── Add skill_id + topic_id to question_library ───────────────────────────────
alter table question_library
  add column if not exists skill_id  uuid references skills(id)       on delete set null,
  add column if not exists topic_id  uuid references skill_topics(id)  on delete set null;

create index if not exists idx_question_library_skill_id  on question_library (skill_id)  where is_approved = true;
create index if not exists idx_question_library_topic_id  on question_library (topic_id)  where is_approved = true;

-- ── Similarity function (requires pg_trgm) ────────────────────────────────────
create or replace function find_similar_skill(input_name text, threshold float default 0.7)
returns table(id uuid, name text, slug text, aliases text[])
language sql stable as $$
  select id, name, slug, aliases
  from skills
  where similarity(lower(name), lower(input_name)) >= threshold
    and is_active = true
  order by similarity(lower(name), lower(input_name)) desc
  limit 1;
$$;

-- ── Auto-increment topic_count trigger ───────────────────────────────────────
create or replace function increment_skill_topic_count()
returns trigger language plpgsql as $$
begin
  update skills set topic_count = topic_count + 1 where id = NEW.skill_id;
  return NEW;
end;
$$;

drop trigger if exists trg_skill_topic_insert on skill_topics;
create trigger trg_skill_topic_insert
  after insert on skill_topics
  for each row execute function increment_skill_topic_count();
