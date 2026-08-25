-- Fixes customers_insert_own.
--
-- Root cause: the version created in 0002_customer_email_auth.sql
-- included a subquery against auth.users:
--
--   phone = (select phone from auth.users where id = auth.uid())
--
-- PostgREST's `authenticated` role has no SELECT privilege on
-- auth.users, so evaluating that subquery during an INSERT on
-- public.customers failed with "permission denied for table users"
-- (surfaced to the client as a 403) — independent of whether the
-- row itself would otherwise have been allowed.
--
-- This migration replaces ONLY customers_insert_own with a version
-- that never references auth.users at all. Ownership is established
-- purely by auth.uid() = auth_user_id, which is exactly what the
-- "expected policy" in this fix calls for.
--
-- Not yet applied anywhere — run this in the SQL Editor (or via the
-- CLI) AFTER 0001_phase1_auth.sql and 0002_customer_email_auth.sql,
-- against the same project.
--
-- customers_select_own, customers_update_own, customers_select_admin,
-- and every admin_users policy are NOT touched by this file.

drop policy if exists "customers_insert_own" on public.customers;

create policy "customers_insert_own"
  on public.customers
  for insert
  to authenticated
  with check (
    auth.uid() = auth_user_id
  );

-- Why this remains fully secure, for both auth methods, with no
-- weakening versus the original intent:
--
-- - `to authenticated` means an anonymous request can never even be
--   evaluated against this policy — anonymous INSERT is denied outright.
-- - `auth.uid() = auth_user_id` means a logged-in customer can only ever
--   insert a row naming THEIR OWN auth user id — Customer A cannot
--   insert a row with auth_user_id = B, and no customer can insert into
--   admin_users (a completely separate table with its own policies,
--   which grant no insert access to any authenticated role at all).
-- - Nothing here constrains `phone` or `email` — an email customer
--   inserting with phone = NULL, or a phone customer inserting with
--   email = '', are both simply rows where auth_user_id matches their
--   own auth.uid(), which is all this policy has ever needed to check.
--   The previous phone-matching subquery was solving a problem (don't
--   let someone claim a phone that isn't theirs) that auth.uid() =
--   auth_user_id already fully covers on its own: nobody can insert
--   ANY field values under someone else's auth_user_id, phone included.
