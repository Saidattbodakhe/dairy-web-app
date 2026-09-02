-- Phase 4.2 — Order status history / tracking.
--
-- Adds public.order_status_history (an append-only audit trail) and
-- wires exactly one insert into each of create_order/update_order_status/
-- cancel_order so OrderDetail can show a real timeline instead of
-- fabricating one client-side. Does not touch 0001-0010 at all, and
-- does not touch any Phase 4.1 payment table/RPC.
--
-- Every RPC body below is copied verbatim from its current source
-- (create_order from 0010_payment_foundation.sql, update_order_status
-- and cancel_order from 0008_order_functions.sql — all re-read from
-- disk immediately before writing this migration, not reconstructed
-- from memory) with only the additive/necessary changes called out in
-- each function's own comment below.
--
-- Not yet applied anywhere — run this AFTER 0010_payment_foundation.sql,
-- against the same project.

-- ---------------------------------------------------------------------
-- order_status_history
-- ---------------------------------------------------------------------
create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  status text not null
    check (status in ('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled')),
  changed_by_type text not null check (changed_by_type in ('customer', 'admin', 'system')),
  changed_by_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists idx_order_status_history_order_id_created_at
  on public.order_status_history (order_id, created_at);

-- ---------------------------------------------------------------------
-- RLS — SELECT only, for both customers (own order) and admins (all).
-- Deliberately NO insert/update/delete policy for ANY role — the only
-- writes are the single `insert` statement added to each of the three
-- RPCs below, all SECURITY DEFINER, which bypass RLS for their own
-- internal writes but perform their own explicit authorization checks
-- first, exactly like orders/order_items/payments already do.
-- ---------------------------------------------------------------------
alter table public.order_status_history enable row level security;

create policy "order_status_history_select_own"
  on public.order_status_history for select
  using (
    exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = order_id and c.auth_user_id = auth.uid()
    )
  );

create policy "order_status_history_select_all_admin"
  on public.order_status_history for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- create_order — every line is identical to 0010_payment_foundation.sql
-- (which itself was byte-identical to 0008 except the payment_status
-- fix). The ONLY change here is one new `insert into
-- order_status_history` immediately after the order row's id is known,
-- recording the initial Pending status as customer-initiated (the
-- customer's own act of placing the order). Nothing else in this
-- function — customer/address checks, variant validation, FOR UPDATE
-- locking, min/max-qty and stock checks, pricing, order_items inserts,
-- stock decrement, error codes, return shape — is touched.
-- ---------------------------------------------------------------------
create or replace function public.create_order(
  p_items jsonb,
  p_address_id uuid,
  p_delivery_date date,
  p_delivery_slot text,
  p_payment_method text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_address public.customer_addresses;
  v_item jsonb;
  v_variant record;
  v_quantity integer;
  v_line_total numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_delivery_charge numeric(10, 2);
  v_total numeric(10, 2);
  v_order_id uuid;
  v_order_number text;
begin
  -- 1-2. Resolve the REAL authenticated customer — never trust a
  -- client-supplied customer id.
  select id into v_customer_id from public.customers where auth_user_id = auth.uid();
  if v_customer_id is null then
    raise exception 'CUSTOMER_NOT_FOUND';
  end if;

  if p_payment_method not in ('Cash on Delivery', 'Online Payment') then
    raise exception 'INVALID_PAYMENT_METHOD';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- The address must exist AND belong to this customer.
  select * into v_address from public.customer_addresses
    where id = p_address_id and customer_id = v_customer_id;
  if v_address.id is null then
    raise exception 'ADDRESS_NOT_FOUND';
  end if;

  v_order_number := public.generate_order_number();

  -- Order row is created first (totals filled in after the loop below),
  -- so order_items can reference a real order_id throughout.
  insert into public.orders (
    customer_id, order_number, status, payment_method, payment_status,
    subtotal, discount, delivery_charge, total_amount,
    delivery_address_snapshot, delivery_date, delivery_slot
  ) values (
    v_customer_id, v_order_number, 'Pending', p_payment_method,
    case when p_payment_method = 'Online Payment' then 'Pending' else 'Pending' end,
    0, 0, 0, 0,
    jsonb_build_object(
      'label', v_address.label, 'line1', v_address.line1, 'line2', v_address.line2,
      'landmark', v_address.landmark, 'city', v_address.city, 'state', v_address.state,
      'pincode', v_address.pincode, 'phone', v_address.phone
    ),
    p_delivery_date, p_delivery_slot
  )
  returning id into v_order_id;

  -- Phase 4.2 addition: record the initial Pending status. The
  -- customer placing the order is the "actor" for this first row.
  insert into public.order_status_history (order_id, status, changed_by_type, changed_by_id)
  values (v_order_id, 'Pending', 'customer', v_customer_id);

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity is null or v_quantity <= 0 then
      raise exception 'INVALID_QUANTITY';
    end if;

    -- 3-7. Lock the variant row (FOR UPDATE) so a concurrent order on
    -- the same variant must wait for this transaction to finish before
    -- it can see/act on the stock figure — this is what prevents two
    -- customers from both successfully buying the last unit.
    select pv.id, pv.product_id, pv.name, pv.quantity_value, pv.unit, pv.price,
           pv.stock_quantity, pv.is_active, pv.min_order_qty, pv.max_order_qty,
           p.is_active as product_is_active, p.name as product_name
      into v_variant
      from public.product_variants pv
      join public.products p on p.id = pv.product_id
      where pv.id = (v_item ->> 'variant_id')::uuid
      for update of pv;

    if v_variant.id is null then
      raise exception 'VARIANT_NOT_FOUND';
    end if;
    if not v_variant.product_is_active or not v_variant.is_active then
      raise exception 'VARIANT_UNAVAILABLE: %', v_variant.name;
    end if;
    -- 9. min/max order qty, only when set.
    if v_variant.min_order_qty is not null and v_quantity < v_variant.min_order_qty then
      raise exception 'BELOW_MIN_ORDER_QTY: %', v_variant.name;
    end if;
    if v_variant.max_order_qty is not null and v_quantity > v_variant.max_order_qty then
      raise exception 'ABOVE_MAX_ORDER_QTY: %', v_variant.name;
    end if;
    -- 7-8. Stock check against the CURRENT, just-locked row.
    if v_variant.stock_quantity < v_quantity then
      raise exception 'INSUFFICIENT_STOCK: %', v_variant.name;
    end if;

    -- 6, 10, 15-19. Authoritative price + snapshot, from the database,
    -- never from whatever the cart/checkout UI displayed.
    v_line_total := v_variant.price * v_quantity;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.order_items (
      order_id, product_id, variant_id, product_name_snapshot, variant_name_snapshot,
      quantity_value_snapshot, unit_snapshot, unit_price, quantity, line_total
    ) values (
      v_order_id, v_variant.product_id, v_variant.id, v_variant.product_name, v_variant.name,
      v_variant.quantity_value, v_variant.unit, v_variant.price, v_quantity, v_line_total
    );

    -- 23. Decrement stock atomically, inside this same transaction.
    update public.product_variants
      set stock_quantity = stock_quantity - v_quantity, updated_at = now()
      where id = v_variant.id;
  end loop;

  -- 12. Delivery charge — same rule as the existing
  -- utils/orderTotals.js (free at/above ₹500 subtotal, else a flat
  -- ₹30), just recomputed here so the client can never override it.
  v_delivery_charge := case when v_subtotal >= 500 then 0 else 30 end;
  v_total := v_subtotal + v_delivery_charge;

  update public.orders
    set subtotal = v_subtotal, delivery_charge = v_delivery_charge, total_amount = v_total
    where id = v_order_id;

  -- 24. Hand back exactly what the frontend needs to show a
  -- confirmation and navigate to the order — nothing the caller
  -- supplied is trusted anywhere above; everything returned here was
  -- computed server-side.
  return jsonb_build_object(
    'id', v_order_id,
    'order_number', v_order_number,
    'subtotal', v_subtotal,
    'delivery_charge', v_delivery_charge,
    'total_amount', v_total
  );
end;
$$;

-- ---------------------------------------------------------------------
-- update_order_status — admin-only, status-only. Cancellation is
-- explicitly rejected here and must go through cancel_order() instead,
-- so stock is always restored correctly and can never be skipped.
--
-- Phase 4.2 changes, both additive/necessary only:
--   1. The admin check now also captures the admin's own
--      admin_users.id (v_admin_id), not just a boolean — needed to
--      record who made the change. The authorization OUTCOME is
--      identical: a non-admin still gets NOT_AUTHORIZED.
--   2. One new `insert into order_status_history` after the existing
--      `update public.orders set status = ...` line.
-- Every status-validation and transition-graph line is unchanged.
-- ---------------------------------------------------------------------
create or replace function public.update_order_status(p_order_id uuid, p_new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_admin_id uuid;
  v_current_status text;
  v_valid_next text[];
begin
  select id into v_admin_id from public.admin_users where auth_user_id = auth.uid();
  v_is_admin := v_admin_id is not null;
  if not v_is_admin then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_new_status not in ('Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered', 'Cancelled') then
    raise exception 'INVALID_STATUS';
  end if;
  if p_new_status = 'Cancelled' then
    raise exception 'USE_CANCEL_ORDER_FUNCTION';
  end if;

  select status into v_current_status from public.orders where id = p_order_id for update;
  if v_current_status is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  v_valid_next := case v_current_status
    when 'Pending' then array['Confirmed']
    when 'Confirmed' then array['Preparing']
    when 'Preparing' then array['Out for Delivery']
    when 'Out for Delivery' then array['Delivered']
    else array[]::text[]
  end;

  if not (p_new_status = any (v_valid_next)) then
    raise exception 'INVALID_TRANSITION: % -> %', v_current_status, p_new_status;
  end if;

  update public.orders set status = p_new_status, updated_at = now() where id = p_order_id;

  insert into public.order_status_history (order_id, status, changed_by_type, changed_by_id)
  values (p_order_id, p_new_status, 'admin', v_admin_id);
end;
$$;

-- ---------------------------------------------------------------------
-- cancel_order — transactional cancellation + stock restoration.
-- Locks the order row first, so two simultaneous cancel attempts on
-- the same order can't both restore stock: the second call always
-- sees status already 'Cancelled' (from the first call, once it
-- commits) and returns without touching stock again.
--
-- Phase 4.2 changes, both additive/necessary only:
--   1. Also captures the admin's own admin_users.id (v_admin_id),
--      not just a boolean — same reasoning as update_order_status.
--   2. Each of the two existing branches (customer-owns-it /
--      admin-acting) now additionally sets v_changed_by_type/
--      v_changed_by_id to record which actor performed this specific
--      cancellation — every existing status check inside each branch
--      is unchanged.
--   3. One new `insert into order_status_history` after the existing
--      final `update public.orders set status = 'Cancelled' ...`
--      line — i.e. only on an ACTUAL cancellation. The existing
--      already-Cancelled no-op `return` above is completely
--      untouched, so no history row is ever inserted for it.
-- The stock-restoration loop and every authorization/status check are
-- byte-identical to before.
-- ---------------------------------------------------------------------
create or replace function public.cancel_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_is_admin boolean;
  v_admin_id uuid;
  v_order public.orders;
  v_item record;
  v_changed_by_type text;
  v_changed_by_id uuid;
begin
  select id into v_customer_id from public.customers where auth_user_id = auth.uid();
  select id into v_admin_id from public.admin_users where auth_user_id = auth.uid();
  v_is_admin := v_admin_id is not null;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'Cancelled' then
    return; -- already cancelled — no-op, never restores stock twice, no history row.
  end if;

  if v_customer_id is not null and v_order.customer_id = v_customer_id then
    if v_order.status not in ('Pending', 'Confirmed') then
      raise exception 'CANNOT_CANCEL_AT_THIS_STAGE';
    end if;
    v_changed_by_type := 'customer';
    v_changed_by_id := v_customer_id;
  elsif v_is_admin then
    if v_order.status not in ('Pending', 'Confirmed', 'Preparing') then
      raise exception 'CANNOT_CANCEL_AT_THIS_STAGE';
    end if;
    v_changed_by_type := 'admin';
    v_changed_by_id := v_admin_id;
  else
    raise exception 'NOT_AUTHORIZED';
  end if;

  for v_item in select * from public.order_items where order_id = p_order_id
  loop
    if v_item.variant_id is not null then
      update public.product_variants
        set stock_quantity = stock_quantity + v_item.quantity, updated_at = now()
        where id = v_item.variant_id;
    end if;
  end loop;

  update public.orders set status = 'Cancelled', updated_at = now() where id = p_order_id;

  insert into public.order_status_history (order_id, status, changed_by_type, changed_by_id)
  values (p_order_id, 'Cancelled', v_changed_by_type, v_changed_by_id);
end;
$$;

-- ---------------------------------------------------------------------
-- No grant/revoke statements needed here: create_order,
-- update_order_status, and cancel_order all keep their exact existing
-- signatures, so `create or replace function` preserves their current
-- grants (already correctly scoped by 0008/0009) automatically.
-- order_status_history itself is never called as an RPC — it's read
-- via the normal PostgREST table API, governed entirely by the RLS
-- policies above.
-- ---------------------------------------------------------------------
