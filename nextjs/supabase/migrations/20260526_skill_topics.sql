-- Skill Topics: sub-topics that belong to a skill
create table if not exists skill_topics (
  id          uuid primary key default gen_random_uuid(),
  skill_id    uuid not null references skills(id) on delete cascade,
  name        text not null,
  slug        text,
  description text,
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id),
  unique(skill_id, name)
);

create index if not exists idx_skill_topics_skill_id on skill_topics(skill_id);

-- RLS: admins can do anything; authenticated users can read active topics
alter table skill_topics enable row level security;

create policy "admins_all_skill_topics"
  on skill_topics for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role = 'admin'
    )
  );

create policy "users_read_active_skill_topics"
  on skill_topics for select
  using (is_active = true);
