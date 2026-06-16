-- Notes feature: block editor notes linked to topics or standalone

create table if not exists notes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null default 'Untitled',
  content         jsonb not null default '{}',
  icon            text,
  cover_url       text,
  is_pinned       boolean not null default false,
  is_archived     boolean not null default false,
  word_count      integer not null default 0,
  context_type    text check (context_type in ('topic', 'career_map', 'resume') or context_type is null),
  context_id      uuid,
  parent_id       uuid references notes(id) on delete cascade,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_notes_user_id   on notes (user_id, is_archived, updated_at desc);
create index idx_notes_context   on notes (context_type, context_id) where context_id is not null;
create index idx_notes_parent    on notes (parent_id) where parent_id is not null;
create index idx_notes_search    on notes using gin (
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content::text, ''))
);

alter table notes enable row level security;

create policy "notes_owner_only"
  on notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_notes_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger notes_updated_at
  before update on notes
  for each row execute function update_notes_updated_at();
