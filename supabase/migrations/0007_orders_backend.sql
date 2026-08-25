-- Phase 3 — Orders + Checkout backend: schema only. RPCs live in
-- 0008_order_functions.sql. Does not touch 0001-0006 or their policies.
--
-- Not yet applied anywhere — run this AFTER 0001-0006, against the
-- same project.

-- ---------------------------------------------------------------------
-- customer_addresses
-- ---------------------------------------------------------------------
create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  label text not null default '',
  line1 text not null,
  line2 text not null default '',
  landmark text not null default '',
  city text not null,
  state text not null,
  pincode text not null,
  phone text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_customer_addresses_customer_id on public.customer_addresses (customer_id);

-- Database-guaranteed "at most one default per customer" — a partial
-- unique index, backed by a trigger (below) that unsets any previous
-- default before a new one is written, so the invariant holds no
-- matter which client/path performs the write.
create unique index if not exists idx_customer_addresses_one_default
  on public.customer_addresses (customer_id)
  where is_default = true;

create or replace function public.enforce_single_default_address()
returns trigger
language plpgsql
as $$
begin
  if new.is_default then
    update public.customer_addresses
      set is_default = false
      where customer_id = new.customer_id
        and id <> new.id
        and is_default = true;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_single_default_address on public.customer_addresses;
create trigger trg_enforce_single_default_address
  before insert or update on public.customer_addresses
  for each row
  execute function public.enforce_single_default_address();

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete restrict,
  order_number text not null unique,
  status text not null default 'Pending'
    check (status in ('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')),
  payment_method text not null check (payment_method in ('Cash on Delivery', 'Online Payment')),
  payment_status text not null default 'Pending' check (payment_status in ('Pending', 'Paid', 'Failed')),
  subtotal numeric(10, 2) not null default 0,
  discount numeric(10, 2) not null default 0,
  delivery_charge numeric(10, 2) not null default 0,
  total_amount numeric(10, 2) not null default 0,
  delivery_address_snapshot jsonb not null,
  delivery_date date,
  delivery_slot text,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_customer_id on public.orders (customer_id);
create index if not exists idx_orders_status on public.orders (status);
create index if not exists idx_orders_order_number on public.orders (order_number);

-- ---------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text not null,
  quantity_value_snapshot numeric not null,
  unit_snapshot text not null,
  unit_price numeric(10, 2) not null,
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_items_order_id on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------
alter table public.customer_addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- customer_addresses: full owner CRUD, no admin policy at all — admins
-- never need to read a customer's address book directly, since every
-- order already carries its own delivery_address_snapshot.
create policy "customer_addresses_select_own"
  on public.customer_addresses for select
  using (exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid()));

create policy "customer_addresses_insert_own"
  on public.customer_addresses for insert
  with check (exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid()));

create policy "customer_addresses_update_own"
  on public.customer_addresses for update
  using (exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid()))
  with check (exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid()));

create policy "customer_addresses_delete_own"
  on public.customer_addresses for delete
  using (exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid()));

-- orders / order_items: SELECT only, for both customers (own rows) and
-- admins (all rows). Deliberately NO insert/update/delete policy for
-- ANY role, customer or admin — the only way any of these rows are
-- ever written is through the SECURITY DEFINER RPCs in
-- 0008_order_functions.sql, which bypass RLS for their own internal
-- writes but perform their own explicit ownership/authorization checks
-- first. This is what makes "customer cannot change status/total/
-- customer_id" and "admin cannot arbitrarily edit historical totals"
-- true at the database level, not just a frontend convention.
create policy "orders_select_own"
  on public.orders for select
  using (exists (select 1 from public.customers c where c.id = customer_id and c.auth_user_id = auth.uid()));

create policy "orders_select_all_admin"
  on public.orders for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

create policy "order_items_select_own"
  on public.order_items for select
  using (exists (
    select 1 from public.orders o
    join public.customers c on c.id = o.customer_id
    where o.id = order_id and c.auth_user_id = auth.uid()
  ));

create policy "order_items_select_all_admin"
  on public.order_items for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));
