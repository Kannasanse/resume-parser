-- Allow admins to read and update all credit_requests rows.
-- The service-role key already bypasses RLS, but these policies
-- ensure correctness if ever accessed with the anon/user key.

drop policy if exists "admins_all_credit_requests" on public.credit_requests;
create policy "admins_all_credit_requests" on public.credit_requests
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Same for credit_transactions so admins can view all history
drop policy if exists "admins_all_credit_transactions" on public.credit_transactions;
create policy "admins_all_credit_transactions" on public.credit_transactions
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Same for user_credits
drop policy if exists "admins_all_user_credits" on public.user_credits;
create policy "admins_all_user_credits" on public.user_credits
  for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
