-- Notes features: tags, public sharing, wikilinks

-- Extend the notes table
alter table notes
  add column if not exists tags         text[]  default '{}',
  add column if not exists share_token  text,
  add column if not exists is_public    boolean default false,
  add column if not exists public_title text;

-- Unique index for share token lookups (fast public fetch)
create unique index if not exists idx_notes_share_token
  on notes (share_token) where share_token is not null;

-- GIN index for array-containment tag queries
create index if not exists idx_notes_tags
  on notes using gin(tags);

-- Allow public reads of shared notes (the public API route uses service role,
-- but this permits direct reads for shared notes without auth)
do $$
begin
  create policy "notes_public_read"
    on notes for select
    using (is_public = true and share_token is not null);
exception when duplicate_object then null;
end;
$$;

-- ── Note tags registry ─────────────────────────────────────────────────────────
create table if not exists note_tags (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  slug        text not null,
  label       text not null,
  color       text default '#185FA5',
  usage_count integer default 0,
  created_at  timestamptz default now(),
  unique(user_id, slug)
);

alter table note_tags enable row level security;

do $$
begin
  create policy "note_tags_owner"
    on note_tags for all
    using  (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end;
$$;

create index if not exists idx_note_tags_user
  on note_tags (user_id, usage_count desc);
