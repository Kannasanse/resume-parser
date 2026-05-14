-- ── Credit tables ────────────────────────────────────────────────────────────

create table if not exists public.user_credits (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  balance    integer not null default 30,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.credit_transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  amount      integer not null,  -- positive = added, negative = consumed
  type        text not null,     -- ats_score | resume_import | admin_grant | initial_grant | request_approved
  description text,
  metadata    jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.credit_requests (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  amount_requested integer not null default 10,
  reason           text,
  status           text not null default 'pending', -- pending | approved | rejected
  reviewed_by      uuid references auth.users(id),
  reviewed_at      timestamptz,
  admin_notes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Indexes
create index if not exists credit_transactions_user_id_idx on public.credit_transactions(user_id);
create index if not exists credit_requests_user_id_idx     on public.credit_requests(user_id);
create index if not exists credit_requests_status_idx      on public.credit_requests(status);

-- RLS
alter table public.user_credits       enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.credit_requests     enable row level security;

-- user_credits: users see own row only
drop policy if exists "users_own_credits"       on public.user_credits;
create policy "users_own_credits" on public.user_credits
  for all using (auth.uid() = user_id);

-- credit_transactions: users see own
drop policy if exists "users_own_transactions"  on public.credit_transactions;
create policy "users_own_transactions" on public.credit_transactions
  for all using (auth.uid() = user_id);

-- credit_requests: users see/create own
drop policy if exists "users_own_requests"      on public.credit_requests;
create policy "users_own_requests" on public.credit_requests
  for all using (auth.uid() = user_id);

-- Atomic deduct (only if balance >= amount)
create or replace function public.deduct_credits(p_user_id uuid, p_amount integer)
returns integer language plpgsql security definer as $$
declare
  new_balance integer;
begin
  update public.user_credits
  set    balance    = balance - p_amount,
         updated_at = now()
  where  user_id = p_user_id
    and  balance >= p_amount
  returning balance into new_balance;

  if not found then
    return -1;  -- insufficient
  end if;
  return new_balance;
end;
$$;

-- Atomic add
create or replace function public.add_credits(p_user_id uuid, p_amount integer)
returns integer language plpgsql security definer as $$
declare
  new_balance integer;
begin
  update public.user_credits
  set    balance    = balance + p_amount,
         updated_at = now()
  where  user_id = p_user_id
  returning balance into new_balance;
  return new_balance;
end;
$$;
