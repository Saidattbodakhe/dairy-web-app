-- Phase 2 — Storage bucket for Admin-managed product/hero images.
-- One bucket, shared by both product and hero images, organized by
-- path prefix (products/{product-id}/... and heroes/{slide-id}/...)
-- rather than separate buckets, per the approved design.
--
-- Not yet applied anywhere. Storage buckets/policies are project-level
-- objects — this file's statements can be run from the SQL Editor like
-- any other migration; they operate on Supabase's own storage.buckets
-- / storage.objects tables.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public bucket ⇒ anyone can GET an object's public URL directly
-- without a policy check, which is what lets `<img src="...">` work
-- for anonymous customers. This SELECT policy additionally covers any
-- listing/metadata read through the Storage API itself.
create policy "product_images_bucket_public_read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Every write operation is admin-only, verified the same way as every
-- other admin-write policy in this project — via admin_users, never a
-- frontend flag, and never the service_role key.
create policy "product_images_bucket_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid())
  );

create policy "product_images_bucket_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid())
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid())
  );

create policy "product_images_bucket_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid())
  );
