-- Phase 3 fix — anon currently has EXECUTE on all three order RPCs in
-- the live database, despite 0008_order_functions.sql already ending
-- with `revoke all ... from public` + `grant execute ... to
-- authenticated`. Root cause: Supabase provisions every new project
-- with a schema-level default privilege —
--   alter default privileges in schema public
--     grant execute on functions to anon, authenticated, service_role;
-- — so the moment `create or replace function public.create_order(...)`
-- (and the other two) ran, Postgres auto-granted EXECUTE directly to
-- anon/authenticated/service_role as those roles, not to the PUBLIC
-- pseudo-role. `revoke all on function ... from public` only revokes
-- the separate, PUBLIC-wide grant Postgres also makes on every new
-- function by default — it has no effect on a grant already recorded
-- against `anon` by name, so `anon`'s direct EXECUTE grant survived.
--
-- This migration does not touch 0007 or 0008, does not change any
-- function body/business logic, and does not touch service_role —
-- it only revokes anon's (and, for completeness, PUBLIC's) EXECUTE on
-- the three existing order RPCs and re-confirms authenticated's grant.
--
-- Not yet applied anywhere — run this AFTER 0008_order_functions.sql,
-- against the same project.

-- ---------------------------------------------------------------------
-- create_order(jsonb, uuid, date, text, text)
-- ---------------------------------------------------------------------
revoke execute on function public.create_order(jsonb, uuid, date, text, text) from public;
revoke execute on function public.create_order(jsonb, uuid, date, text, text) from anon;
grant execute on function public.create_order(jsonb, uuid, date, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- update_order_status(uuid, text)
-- ---------------------------------------------------------------------
revoke execute on function public.update_order_status(uuid, text) from public;
revoke execute on function public.update_order_status(uuid, text) from anon;
grant execute on function public.update_order_status(uuid, text) to authenticated;

-- ---------------------------------------------------------------------
-- cancel_order(uuid)
-- ---------------------------------------------------------------------
revoke execute on function public.cancel_order(uuid) from public;
revoke execute on function public.cancel_order(uuid) from anon;
grant execute on function public.cancel_order(uuid) to authenticated;

-- service_role is never referenced above — its EXECUTE grant (made by
-- the same Supabase default-privilege mechanism described above) is
-- left completely untouched, since service_role must keep the ability
-- to call these RPCs from trusted server-side contexts.
