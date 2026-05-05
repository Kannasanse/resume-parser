-- RBAC Schema — run in Supabase SQL Editor
-- Adds profiles, invite_tokens, audit_log, and rate-limit tables
-- Also installs a trigger that auto-creates a profile row for every new auth.users row

-- ─── profiles ───────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  email           text not null,
  first_name      text not null default '',
  last_name       text not null default '',
  role            text not null default 'user'
                    check (role in ('user', 'admin')),
  status          text not null default 'pending'
                    check (status in ('pending', 'active', 'deactivated')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  email_verified_at timestamptz,
  last_login_at   timestamptz,
  failed_login_attempts int not null default 0,
  locked_until    timestamptz
);

alter table public.profiles enable row level security;

-- Each user can read their own profile; admin reads are done via service role
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id)
  with check (auth.uid() = id);

-- ─── invite_tokens ───────────────────────────────────────────────────────────
create table if not exists public.invite_tokens (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  role          text not null default 'user'
                  check (role in ('user', 'admin')),
  token         text not null unique,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  expires_at    timestamptz not null default (now() + interval '7 days'),
  used_at       timestamptz,
  cancelled_at  timestamptz,
  status        text not null default 'pending'
                  check (status in ('pending', 'used', 'expired', 'cancelled')),
  resend_count  int not null default 0,
  last_resent_at timestamptz
);

alter table public.invite_tokens enable row level security;
-- Only service role accesses this table (admin operations)

-- ─── audit_log ───────────────────────────────────────────────────────────────
create table if not exists public.audit_log (
  id             bigint generated always as identity primary key,
  performed_by   uuid references auth.users(id) on delete set null,
  action         text not null,
  target_user_id uuid,
  target_email   text,
  details        jsonb,
  ip_address     text,
  created_at     timestamptz not null default now()
);

alter table public.audit_log enable row level security;
-- Only service role accesses this table

-- ─── email_resend_limits ─────────────────────────────────────────────────────
create table if not exists public.email_resend_limits (
  email         text primary key,
  resend_count  int not null default 0,
  window_start  timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.email_resend_limits enable row level security;

-- ─── Trigger: auto-create profile on new Supabase auth user ──────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, role, status, email_verified_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user'),
    case
      when new.email_confirmed_at is not null then 'active'
      else 'pending'
    end,
    new.email_confirmed_at
  )
  on conflict (id) do update set
    email           = excluded.email,
    first_name      = case when excluded.first_name != '' then excluded.first_name else profiles.first_name end,
    last_name       = case when excluded.last_name  != '' then excluded.last_name  else profiles.last_name  end,
    role            = case when excluded.role       != 'user' then excluded.role   else profiles.role       end,
    updated_at      = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: update profile when email is confirmed
create or replace function public.handle_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Activate profile when email gets confirmed
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.profiles
    set status = 'active', email_verified_at = new.email_confirmed_at, updated_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update on auth.users
  for each row execute procedure public.handle_user_updated();

-- ─── Helper: expire stale invite tokens ──────────────────────────────────────
create or replace function public.expire_invite_tokens()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.invite_tokens
  set status = 'expired'
  where status = 'pending' and expires_at < now();
end;
$$;
