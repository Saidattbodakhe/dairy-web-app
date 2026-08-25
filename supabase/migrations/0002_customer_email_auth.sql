-- Phase 1.5 — Customer Email Signup + Login.
-- Adds NOTHING new to admin_users and does not touch its policies at
-- all. The only change here is making the existing `customers` table
-- able to represent an email-only customer (no phone number), which
-- the original Phase 1 schema/policy did not support.
--
-- Not yet applied anywhere — run this in the SQL Editor (or via the
-- CLI) AFTER 0001_phase1_auth.sql, against the same project.

-- ---------------------------------------------------------------------
-- 1. Allow customers.phone to be absent
-- ---------------------------------------------------------------------
-- Phone/OTP customers still get a real phone value; email/password
-- customers now get NULL here instead. UNIQUE is left in place —
-- Postgres never treats two NULLs as duplicates under a UNIQUE
-- constraint, so this can't be used to create ambiguous/colliding rows.
alter table public.customers
  alter column phone drop not null;

-- ---------------------------------------------------------------------
-- 2. Replace customers_insert_own to also cover email signups
-- ---------------------------------------------------------------------
-- The original policy required the inserted `phone` to exactly match
-- auth.users.phone — correct for phone/OTP, but an email/password user
-- has no phone in auth.users at all (it's NULL there too), so the old
-- check would always reject their profile insert.
--
-- This does NOT weaken the security guarantee: the ownership check
-- (auth.uid() = auth_user_id) is unchanged, and a customer still can
-- NEVER claim a phone number that isn't their own — the added branch
-- only permits `phone is null`, which never lets anyone impersonate
-- someone else's real phone number. It only accommodates customers who
-- legitimately have no phone number at all yet.
drop policy if exists "customers_insert_own" on public.customers;

create policy "customers_insert_own"
  on public.customers for insert
  with check (
    auth.uid() = auth_user_id
    and (
      phone is null
      or phone = (select phone from auth.users where id = auth.uid())
    )
  );

-- customers_select_own, customers_update_own, customers_select_admin,
-- and every admin_users policy are unchanged — not touched by this file.
