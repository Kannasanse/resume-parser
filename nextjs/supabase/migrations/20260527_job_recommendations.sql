-- Add headline, location, skills to profiles (needed for job query building)
alter table public.profiles
  add column if not exists headline text,
  add column if not exists location text,
  add column if not exists skills   text[] default '{}';

-- job_listings_cache: caches JSearch results per (job_title, city) pair for 12 hours
create table if not exists job_listings_cache (
  id            uuid primary key default gen_random_uuid(),
  cache_key     text not null unique,
  query_text    text not null,
  job_title     text not null,
  city          text not null,
  country       text not null default 'India',
  jobs          jsonb not null,
  result_count  integer not null default 0,
  hit_count     integer not null default 0,
  cached_at     timestamptz not null default now(),
  expires_at    timestamptz not null,
  last_hit_at   timestamptz
);

create index if not exists idx_job_cache_key        on job_listings_cache (cache_key);
create index if not exists idx_job_cache_expires    on job_listings_cache (expires_at);
create index if not exists idx_job_cache_title_city on job_listings_cache (job_title, city);

-- user_job_interactions: tracks viewed/applied/saved/dismissed per user
create table if not exists user_job_interactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  job_id      text not null,
  job_title   text not null default '',
  company     text not null default '',
  action      text not null check (action in ('viewed', 'applied', 'saved', 'dismissed')),
  cache_key   text,
  created_at  timestamptz default now()
);

create index if not exists idx_job_interactions_user
  on user_job_interactions (user_id, created_at desc);

alter table user_job_interactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'user_job_interactions' and policyname = 'Owner only'
  ) then
    create policy "Owner only" on user_job_interactions
      for all using (auth.uid() = user_id);
  end if;
end $$;

-- jsearch_quota_log: counts monthly API calls — stay under 200/month free tier
create table if not exists jsearch_quota_log (
  id           uuid primary key default gen_random_uuid(),
  called_at    timestamptz default now(),
  query        text,
  result_count integer
);

create index if not exists idx_jsearch_quota_log_month
  on jsearch_quota_log (called_at desc);
