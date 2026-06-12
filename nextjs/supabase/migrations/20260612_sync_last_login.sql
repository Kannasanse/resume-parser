-- Sync auth.users.last_sign_in_at → profiles.last_login_at automatically
-- on every successful Supabase sign-in (covers password, magic link, OAuth, etc.)

create or replace function public.sync_last_login()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only fire when last_sign_in_at actually changes
  if NEW.last_sign_in_at is distinct from OLD.last_sign_in_at then
    update public.profiles
    set last_login_at = NEW.last_sign_in_at,
        updated_at    = now()
    where id = NEW.id;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_auth_user_sign_in on auth.users;
create trigger on_auth_user_sign_in
  after update on auth.users
  for each row execute function public.sync_last_login();

-- Backfill existing users from auth.users.last_sign_in_at
update public.profiles p
set last_login_at = u.last_sign_in_at,
    updated_at    = now()
from auth.users u
where p.id = u.id
  and u.last_sign_in_at is not null
  and (p.last_login_at is null or u.last_sign_in_at > p.last_login_at);
