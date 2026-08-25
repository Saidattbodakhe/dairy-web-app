-- Phase 1 — Auth only.
-- Creates exactly two tables (customers, admin_users) plus their RLS
-- policies. No products/orders/subscriptions/addresses/etc — those are
-- explicitly out of scope for this phase.
--
-- This project has no live Supabase instance connected yet, so this
-- file has not been applied anywhere. Run it via the Supabase SQL
-- Editor, or `supabase db push` / `supabase migration up` once the CLI
-- is linked to a real project.
--
-- Statement order matters here: both tables are created first, THEN
-- RLS is enabled on both, THEN policies are added — customers'
-- "customers_select_admin" policy references admin_users, so
-- admin_users must already exist by the time that policy is created.

-- ---------------------------------------------------------------------
-- 1. customers
-- ---------------------------------------------------------------------
-- One row per authenticated customer, linked 1:1 to a Supabase Auth
-- user created via phone/OTP sign-in. `name`/`email` are optional
-- profile fields the customer can fill in themselves (matches
-- Profile.jsx's current "Demo Customer" / editable-name shape).
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  name text not null default '',
  phone text not null unique,
  email text not null default '',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. admin_users
-- ---------------------------------------------------------------------
-- One row per authorized admin, linked 1:1 to a Supabase Auth user
-- created via email/password sign-in. `role` is a single fixed value
-- today ('admin') on purpose — the column (and this CHECK) is what
-- makes future role tiers (super_admin/staff/manager) an additive
-- change later, not a redesign.
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. Enable RLS on both tables
-- ---------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.admin_users enable row level security;

-- ---------------------------------------------------------------------
-- 4. customers policies
-- ---------------------------------------------------------------------
-- A customer may create only their OWN row, and only with the phone
-- number that's actually on their authenticated session — this is what
-- stops one customer from ever inserting a row impersonating another.
create policy "customers_insert_own"
  on public.customers for insert
  with check (
    auth.uid() = auth_user_id
    and phone = (select phone from auth.users where id = auth.uid())
  );

create policy "customers_select_own"
  on public.customers for select
  using (auth.uid() = auth_user_id);

create policy "customers_update_own"
  on public.customers for update
  using (auth.uid() = auth_user_id)
  with check (auth.uid() = auth_user_id);

-- Admins can look customers up (read-only) — no admin update/delete
-- policy exists in Phase 1, since nothing in the current Admin UI
-- edits a customer's own profile fields. This is the policy that
-- depends on admin_users already existing (created in step 2, above).
create policy "customers_select_admin"
  on public.customers for select
  using (
    exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid())
  );

-- ---------------------------------------------------------------------
-- 5. admin_users policies
-- ---------------------------------------------------------------------
-- Deliberately NO insert/update/delete policy for any authenticated
-- role. A row here can only be created by a project owner running SQL
-- directly (via the dashboard or the service_role key) — never from
-- client code. This is the actual mechanism that prevents a customer
-- (or anyone) from self-elevating to admin; it is not merely a
-- frontend check.
create policy "admin_users_select_own"
  on public.admin_users for select
  using (auth.uid() = auth_user_id);

-- ---------------------------------------------------------------------
-- Example: provisioning the first admin (run manually, once, per admin)
-- ---------------------------------------------------------------------
-- 1. Create the auth user via Authentication → Users → "Add user" in
--    the Supabase dashboard (email/password), or supabase.auth.admin
--    from a trusted server context — never from this frontend.
-- 2. Then, as the project owner:
--    insert into public.admin_users (auth_user_id, email)
--    values ('<the auth user''s UUID>', '<their email>');
