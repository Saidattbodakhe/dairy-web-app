-- Phase 2 — Products backend.
-- Creates product_categories, products, product_variants, product_images
-- and seeds them with the exact current catalog (names/descriptions/
-- prices/variants/images already live in src/data/mockProducts.js).
-- Does not touch customers/admin_users or their policies at all.
--
-- Not yet applied anywhere — run this in the SQL Editor (or via the
-- CLI) AFTER 0001-0003, against the same project.

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------
create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.product_categories (id) on delete restrict,
  name text not null,
  slug text not null unique,
  description text not null default '',
  short_description text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  quantity_value numeric not null,
  unit text not null,
  price numeric(10, 2) not null check (price >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  min_order_qty integer not null default 1 check (min_order_qty >= 1),
  max_order_qty integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, name)
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  image_url text not null,
  alt_text text not null default '',
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique (product_id, sort_order)
);

-- ---------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------
create index if not exists idx_products_category_id on public.products (category_id);
create index if not exists idx_products_is_active on public.products (is_active);
create index if not exists idx_product_variants_product_id on public.product_variants (product_id);
create index if not exists idx_product_variants_is_active on public.product_variants (is_active);
create index if not exists idx_product_images_product_id on public.product_images (product_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;

-- Categories are non-sensitive — public read-all, admin-only write.
create policy "product_categories_select_all"
  on public.product_categories for select
  using (true);

create policy "product_categories_admin_write"
  on public.product_categories for all
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

-- Products: public/customers see only active products; admins see and
-- manage everything (soft-deactivate only — no delete policy, matching
-- "do not permanently delete products" since they may later be
-- referenced by orders).
create policy "products_select_active_public"
  on public.products for select
  using (is_active = true);

create policy "products_select_all_admin"
  on public.products for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "products_admin_insert"
  on public.products for insert
  to authenticated
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "products_admin_update"
  on public.products for update
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

-- Variants: public/customers only ever see active variants of active
-- products — checked here directly (not just relied upon via the
-- parent query) so a direct request against this table can't leak
-- variants of a deactivated product.
create policy "product_variants_select_active_public"
  on public.product_variants for select
  using (
    is_active = true
    and exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );

create policy "product_variants_select_all_admin"
  on public.product_variants for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "product_variants_admin_insert"
  on public.product_variants for insert
  to authenticated
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "product_variants_admin_update"
  on public.product_variants for update
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

-- Images: same active-product-only visibility rule as variants.
create policy "product_images_select_active_public"
  on public.product_images for select
  using (
    exists (select 1 from public.products p where p.id = product_id and p.is_active = true)
  );

create policy "product_images_select_all_admin"
  on public.product_images for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "product_images_admin_insert"
  on public.product_images for insert
  to authenticated
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "product_images_admin_update"
  on public.product_images for update
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "product_images_admin_delete"
  on public.product_images for delete
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- Seed data — idempotent (safe to re-run: categories/products key off
-- their unique name/slug, variants off (product_id, name), images off
-- (product_id, sort_order)). Values are copied verbatim from
-- src/data/mockProducts.js — nothing invented.
-- ---------------------------------------------------------------------
insert into public.product_categories (name) values
  ('Milk'), ('Curd'), ('Paneer'), ('Ghee'), ('Butter'), ('Buttermilk'), ('Lassi')
on conflict (name) do nothing;

insert into public.products (category_id, name, slug, description, short_description, is_active)
select c.id, v.name, v.slug, v.description, v.short_description, true
from (values
  ('Milk', 'Cow Milk', 'cow-milk',
   'Farm-fresh cow milk, collected daily from our own 12 cows and delivered straight to your doorstep every morning. Rich, creamy, and free from any additives.',
   'Farm-fresh milk delivered daily.'),
  ('Milk', 'Buffalo Milk', 'buffalo-milk',
   'Rich, creamy buffalo milk with a higher fat content than cow milk, giving it a naturally thicker, richer taste. Collected daily and delivered fresh.',
   'Rich, creamy, higher-fat buffalo milk.'),
  ('Curd', 'Curd', 'curd',
   'Thick, set curd made fresh every day from our own milk. Naturally fermented with no preservatives, perfect for meals or a cool snack.',
   'Thick, fresh, naturally set curd.'),
  ('Paneer', 'Paneer', 'paneer',
   'Soft, fresh paneer made from pure cow milk. No preservatives, cut and packed fresh on the day of delivery.',
   'Soft, fresh paneer, no preservatives.'),
  ('Ghee', 'Cow Ghee', 'cow-ghee',
   'Traditional bilona-style cow ghee, slow-cooked in small batches from fresh cream for a rich aroma and taste.',
   'Traditional slow-cooked cow ghee.'),
  ('Ghee', 'Buffalo Ghee', 'buffalo-ghee',
   'Traditional bilona-style buffalo ghee, slow-cooked from fresh buffalo cream. Paler in colour than cow ghee, with a rich, dense texture.',
   'Traditional slow-cooked buffalo ghee.'),
  ('Butter', 'Butter', 'butter',
   'Creamy white butter churned fresh from cow milk, unsalted and rich in flavour.',
   'Fresh, creamy, unsalted butter.'),
  ('Buttermilk', 'Buttermilk', 'buttermilk',
   'Light, refreshing spiced buttermilk (chaas) made fresh daily, perfect for a hot afternoon.',
   'Light, refreshing spiced chaas.'),
  ('Lassi', 'Lassi', 'lassi',
   'Sweet, thick lassi made from fresh curd, lightly sweetened and churned to a smooth finish.',
   'Sweet, thick, creamy lassi.')
) as v(category_name, name, slug, description, short_description)
join public.product_categories c on c.name = v.category_name
on conflict (slug) do nothing;

-- Variants — one INSERT per product, keyed by the product's slug.
insert into public.product_variants (product_id, name, quantity_value, unit, price, stock_quantity)
select p.id, v.name, v.quantity_value, v.unit, v.price, v.stock
from public.products p
join (values
  ('cow-milk', '500 ml', 500, 'ml', 30, 40),
  ('cow-milk', '1 litre', 1, 'litre', 58, 35),
  ('cow-milk', '2 litres', 2, 'litre', 112, 20),
  ('cow-milk', '3 litres', 3, 'litre', 165, 10),
  ('cow-milk', '5 litres', 5, 'litre', 270, 5),
  ('buffalo-milk', '500 ml', 500, 'ml', 35, 30),
  ('buffalo-milk', '1 litre', 1, 'litre', 68, 25),
  ('buffalo-milk', '2 litres', 2, 'litre', 130, 15),
  ('buffalo-milk', '3 litres', 3, 'litre', 190, 8),
  ('buffalo-milk', '5 litres', 5, 'litre', 310, 4),
  ('curd', '500 g', 500, 'g', 40, 25),
  ('curd', '1 kg', 1, 'kg', 75, 15),
  ('paneer', '250 g', 250, 'g', 90, 18),
  ('paneer', '500 g', 500, 'g', 170, 12),
  ('cow-ghee', '250 ml', 250, 'ml', 220, 20),
  ('cow-ghee', '500 ml', 500, 'ml', 420, 15),
  ('cow-ghee', '1 litre', 1, 'litre', 800, 8),
  ('buffalo-ghee', '250 ml', 250, 'ml', 260, 16),
  ('buffalo-ghee', '500 ml', 500, 'ml', 500, 10),
  ('buffalo-ghee', '1 litre', 1, 'litre', 950, 5),
  ('butter', '100 g', 100, 'g', 55, 22),
  ('butter', '250 g', 250, 'g', 130, 14),
  ('butter', '500 g', 500, 'g', 250, 6),
  ('buttermilk', '200 ml', 200, 'ml', 15, 30),
  ('buttermilk', '500 ml', 500, 'ml', 32, 20),
  ('buttermilk', '1 litre', 1, 'litre', 58, 10),
  ('lassi', '200 ml', 200, 'ml', 25, 24),
  ('lassi', '500 ml', 500, 'ml', 55, 16)
) as v(slug, name, quantity_value, unit, price, stock)
on v.slug = p.slug
on conflict (product_id, name) do nothing;

-- Images — one primary image per product. These point at files copied
-- into public/images/products/ (stable, unhashed Vite static paths),
-- NOT Supabase Storage — see the Phase 2 final report for why: no live
-- Storage upload could be performed from this environment, so the
-- initial catalog is seeded with working images today, ready to be
-- replaced with real Storage URLs via the new Admin upload UI at any
-- time (image_url is just a string either way, no schema difference).
insert into public.product_images (product_id, image_url, alt_text, sort_order, is_primary)
select p.id, v.image_url, p.name, 0, true
from public.products p
join (values
  ('cow-milk', '/images/products/fresh-cow-milk.jpg'),
  ('buffalo-milk', '/images/products/buffalo-milk.svg'),
  ('curd', '/images/products/curd.jpg'),
  ('paneer', '/images/products/paneer.jpg'),
  ('cow-ghee', '/images/products/ghee.jpg'),
  ('buffalo-ghee', '/images/products/buffalo-ghee.svg'),
  ('butter', '/images/products/butter.jpg'),
  ('buttermilk', '/images/products/buttermilk.jpg'),
  ('lassi', '/images/products/lassi.jpg')
) as v(slug, image_url)
on v.slug = p.slug
on conflict (product_id, sort_order) do nothing;
