-- Phase 2 — Home Hero Carousel becomes database-managed.
-- Creates public.home_hero_slides and seeds it with the current 5
-- slides already in src/components/HeroCarousel.jsx — same headings,
-- text, images, and CTA targets, nothing invented. Per the approved
-- design, each slide has exactly ONE cta (the old slide-1-only
-- secondary "View Products" anchor link is intentionally dropped, per
-- approval, in favour of a single consistent CTA structure).
--
-- Not yet applied anywhere — run this AFTER 0004_products_backend.sql,
-- since 3 of the 5 seeded slides link to products created there.

create table if not exists public.home_hero_slides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text not null,
  cta_text text not null default '',
  cta_type text not null default 'route' check (cta_type in ('route', 'product')),
  cta_route text,
  product_id uuid references public.products (id) on delete set null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint home_hero_slides_cta_shape check (
    (cta_type = 'route' and cta_route is not null)
    or (cta_type = 'product' and product_id is not null)
  )
);

create index if not exists idx_home_hero_slides_active_order
  on public.home_hero_slides (is_active, display_order);

alter table public.home_hero_slides enable row level security;

-- Public/customers: only active slides.
create policy "home_hero_slides_select_active_public"
  on public.home_hero_slides for select
  using (is_active = true);

-- Admins: full read (including inactive) + full manage.
create policy "home_hero_slides_select_all_admin"
  on public.home_hero_slides for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "home_hero_slides_admin_insert"
  on public.home_hero_slides for insert
  to authenticated
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "home_hero_slides_admin_update"
  on public.home_hero_slides for update
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "home_hero_slides_admin_delete"
  on public.home_hero_slides for delete
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

-- Seed — idempotent via a guard on (title, display_order), since this
-- table has no other natural unique key.
insert into public.home_hero_slides
  (title, description, image_url, cta_text, cta_type, cta_route, product_id, display_order)
select v.title, v.description, v.image_url, v.cta_text, v.cta_type,
       v.cta_route, p.id, v.display_order
from (values
  ('Fresh Dairy Delivered To Your Door',
   'Fresh milk and dairy products from our farm, delivered straight to your home every day.',
   '/images/products/fresh-cow-milk.jpg', 'ORDER MILK', 'route', '/products', null, 0),
  ('Fresh From Our Farm',
   'Fresh milk begins with healthy cows, clean surroundings, and quality feed.',
   '/images/hero/cow-grazing.jpg', 'EXPLORE OUR MILK', 'product', null, 'cow-milk', 1),
  ('Pure Fresh Milk, Every Day',
   'Fresh dairy milk delivered to your doorstep, ready for your family''s morning.',
   '/images/hero/milk-pouring.jpg', 'ORDER FRESH MILK', 'product', null, 'cow-milk', 2),
  ('Pure Dairy Ghee',
   'Rich, traditional dairy ghee made for everyday cooking and delicious meals.',
   '/images/products/ghee.jpg', 'VIEW GHEE', 'product', null, 'cow-ghee', 3),
  ('Fresh Creamy Curd',
   'Fresh, creamy curd made from quality dairy milk and delivered to your home.',
   '/images/products/curd.jpg', 'VIEW CURD', 'product', null, 'curd', 4)
) as v(title, description, image_url, cta_text, cta_type, cta_route, product_slug, display_order)
left join public.products p on p.slug = v.product_slug
where not exists (
  select 1 from public.home_hero_slides existing
  where existing.title = v.title and existing.display_order = v.display_order
);
