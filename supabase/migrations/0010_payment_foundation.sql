-- Phase 4.1 — Payment foundation.
--
-- Adds public.payments (transaction/attempt history, separate from the
-- orders.payment_method/payment_status cache columns, which stay
-- exactly as they are) plus four RPCs. Does not touch 0001-0007 or
-- 0009 at all, and does not touch update_order_status/cancel_order in
-- 0008 — the ONE required change is create_order's payment_status
-- initialization (see that section below for the exact, minimal diff
-- against the existing, already-tested function).
--
-- No real payment gateway is integrated here. Selecting "Online
-- Payment" no longer fakes an instant "Paid" — every order, regardless
-- of payment_method, now starts payment_status = 'Pending', and the
-- ONLY paths that can ever change that are the RPCs below.
--
-- Not yet applied anywhere — run this AFTER 0009_fix_order_function_permissions.sql,
-- against the same project.

-- ---------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider text not null,
  provider_reference_id text,
  amount numeric(10, 2) not null,
  currency text not null default 'INR',
  status text not null default 'Pending'
    check (status in ('Pending', 'Authorized', 'Paid', 'Failed', 'Refunded')),
  failure_reason text,
  initiated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_payments_order_id on public.payments (order_id);

-- Duplicate-payment protection: an order can never have more than one
-- successful payment row. A retried/failed attempt doesn't collide
-- with this index (it's a partial index on status = 'Paid' only), so
-- legitimate retries after a Failed attempt are never blocked.
create unique index if not exists idx_payments_one_paid_per_order
  on public.payments (order_id)
  where status = 'Paid';

-- Duplicate provider-reference protection — once a real gateway sends
-- a reference id, the same reference can never be recorded twice
-- (replay/duplicate-webhook protection). Rows with no reference yet
-- (e.g. a freshly created Pending attempt) are unaffected.
create unique index if not exists idx_payments_unique_provider_reference
  on public.payments (provider_reference_id)
  where provider_reference_id is not null;

-- ---------------------------------------------------------------------
-- RLS — SELECT only, for both customers (own order) and admins (all).
-- Deliberately NO insert/update/delete policy for ANY role, exactly
-- like orders/order_items in 0007 — every write below happens only
-- through the four SECURITY DEFINER RPCs, which bypass RLS for their
-- own internal writes but perform their own explicit authorization
-- checks first. Payment status can never be reached through the
-- generic PostgREST table API.
-- ---------------------------------------------------------------------
alter table public.payments enable row level security;

create policy "payments_select_own"
  on public.payments for select
  using (
    exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = order_id and c.auth_user_id = auth.uid()
    )
  );

create policy "payments_select_all_admin"
  on public.payments for select
  to authenticated
  using (exists (select 1 from public.admin_users a where a.auth_user_id = auth.uid()));

-- ---------------------------------------------------------------------
-- create_order — REPLACED to fix the payment_status bug, and ONLY
-- that. Every other line below is copied verbatim from
-- 0008_order_functions.sql (re-read from disk immediately before
-- writing this migration, not reconstructed from memory): identical
-- customer/address ownership checks, identical variant validation and
-- FOR UPDATE locking, identical min/max-qty and stock checks,
-- identical price/subtotal/delivery-charge computation, identical
-- order/order_items inserts and stock decrement, identical error
-- codes, identical return shape.
--
-- The single change is in the INSERT INTO public.orders values list:
--   before: case when p_payment_method = 'Online Payment' then 'Paid' else 'Pending' end
--   after:  case when p_payment_method = 'Online Payment' then 'Pending' else 'Pending' end
-- i.e. every order now starts Pending regardless of payment_method.
-- The case expression is deliberately left in place (not collapsed to
-- a bare 'Pending' literal) so this diff is a single-word change that
-- is trivial to verify against the original function. Marking an
-- order Paid is now exclusively the job of confirm_payment() (Online
-- Payment, service_role only) or mark_cod_payment_collected() (Cash on
-- Delivery, admin only) below — never create_order.
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
-- record_payment_attempt — customer-initiated, creates a Pending
-- payment row. Never marks anything Paid. amount is re-validated
-- against orders.total_amount server-side — the client's number is
-- never trusted, same rule as create_order's own pricing.
-- ---------------------------------------------------------------------
create or replace function public.record_payment_attempt(
  p_order_id uuid,
  p_provider text,
  p_amount numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order public.orders;
  v_payment_id uuid;
begin
  select id into v_customer_id from public.customers where auth_user_id = auth.uid();
  if v_customer_id is null then
    raise exception 'CUSTOMER_NOT_FOUND';
  end if;

  -- The order must exist AND belong to this customer — a foreign order
  -- id simply doesn't match, indistinguishable from a nonexistent one.
  select * into v_order from public.orders
    where id = p_order_id and customer_id = v_customer_id;
  if v_order.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.status = 'Cancelled' then
    raise exception 'ORDER_CANCELLED';
  end if;
  if v_order.status = 'Delivered' then
    raise exception 'ORDER_ALREADY_DELIVERED';
  end if;
  if v_order.payment_status = 'Paid' then
    raise exception 'ORDER_ALREADY_PAID';
  end if;

  if p_provider is null or length(trim(p_provider)) = 0 then
    raise exception 'INVALID_PROVIDER';
  end if;

  if p_amount is null or p_amount <> v_order.total_amount then
    raise exception 'AMOUNT_MISMATCH';
  end if;

  insert into public.payments (order_id, provider, amount, currency, status)
  values (p_order_id, p_provider, p_amount, 'INR', 'Pending')
  returning id into v_payment_id;

  return jsonb_build_object(
    'id', v_payment_id,
    'order_id', p_order_id,
    'provider', p_provider,
    'amount', p_amount,
    'status', 'Pending'
  );
end;
$$;

-- ---------------------------------------------------------------------
-- confirm_payment — service_role ONLY. Represents a trusted, verified
-- confirmation from a future payment provider's server-side webhook.
-- There is deliberately no code path in this codebase that calls this
-- yet — it exists so that wiring a real provider later never requires
-- touching this authorization boundary again.
-- ---------------------------------------------------------------------
create or replace function public.confirm_payment(
  p_payment_id uuid,
  p_provider_reference_id text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  -- Idempotency / duplicate-confirmation protection: once a payment is
  -- already Paid/Failed/Refunded, confirming it again is rejected
  -- outright rather than silently re-applying the update.
  if v_payment.status not in ('Pending', 'Authorized') then
    raise exception 'PAYMENT_ALREADY_FINALIZED';
  end if;

  if p_provider_reference_id is null or length(trim(p_provider_reference_id)) = 0 then
    raise exception 'MISSING_PROVIDER_REFERENCE';
  end if;

  update public.payments
    set status = 'Paid', provider_reference_id = p_provider_reference_id, confirmed_at = now()
    where id = p_payment_id;

  -- Sync the orders cache column. The unique partial index on
  -- (order_id) where status = 'Paid' is the hard backstop that makes
  -- it impossible for two payments on the same order to both end up
  -- Paid, even under a race.
  update public.orders set payment_status = 'Paid' where id = v_payment.order_id;
end;
$$;

-- ---------------------------------------------------------------------
-- mark_payment_failed — service_role ONLY. Never marks an order Paid,
-- never touches order totals — only the payment row's own status and
-- the orders.payment_status cache (kept in sync the same way
-- confirm_payment keeps it in sync, so admin/customer UI never needs
-- to join into payments just to know "did this fail").
--
-- Before writing Failed, this additionally guards against ever
-- regressing the order's payment cache from Paid back to Failed: it
-- locks and checks orders.payment_status directly, AND independently
-- checks whether any OTHER payment row for the same order already
-- succeeded — the second check exists so this is correct even if the
-- orders cache column were ever somehow out of sync with the payments
-- table itself. This can legitimately happen when an older Pending
-- attempt is being failed (e.g. an abandoned/duplicate attempt) after
-- a different, later attempt on the same order already succeeded via
-- confirm_payment() or mark_cod_payment_collected().
-- ---------------------------------------------------------------------
create or replace function public.mark_payment_failed(
  p_payment_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments;
  v_order_payment_status text;
  v_other_paid_exists boolean;
begin
  select * into v_payment from public.payments where id = p_payment_id for update;
  if v_payment.id is null then
    raise exception 'PAYMENT_NOT_FOUND';
  end if;

  if v_payment.status not in ('Pending', 'Authorized') then
    raise exception 'PAYMENT_ALREADY_FINALIZED';
  end if;

  -- Lock the order row too, then verify neither the cache column nor
  -- any sibling payment row already reflects a successful payment
  -- before this attempt is allowed to be marked Failed.
  select payment_status into v_order_payment_status
    from public.orders where id = v_payment.order_id for update;

  if v_order_payment_status = 'Paid' then
    raise exception 'ORDER_ALREADY_PAID';
  end if;

  select exists (
    select 1 from public.payments
    where order_id = v_payment.order_id and status = 'Paid' and id <> p_payment_id
  ) into v_other_paid_exists;

  if v_other_paid_exists then
    raise exception 'ORDER_ALREADY_PAID';
  end if;

  update public.payments
    set status = 'Failed', failure_reason = p_reason
    where id = p_payment_id;

  update public.orders set payment_status = 'Failed' where id = v_payment.order_id;
end;
$$;

-- ---------------------------------------------------------------------
-- mark_cod_payment_collected — authenticated execution, but the body
-- verifies admin_users itself (same pattern as update_order_status/
-- cancel_order) — a non-admin authenticated session is rejected here,
-- not merely by a frontend check. Only for Cash on Delivery orders.
-- Locks the ORDER row first, so two simultaneous "mark collected"
-- clicks on the same order can't both succeed: the second always sees
-- payment_status already 'Paid' (from the first, once it commits) and
-- is rejected, and the unique partial index on payments is a second,
-- independent backstop against the same failure mode.
--
-- No pre-existing payment row is required for a COD order (COD never
-- goes through record_payment_attempt) — if none exists yet, this
-- creates one, already Paid, representing the cash handed over at the
-- door; if a Pending/Authorized one already exists (e.g. a COD order
-- that had an earlier online-payment attempt recorded against it),
-- that row is completed instead of creating a duplicate.
-- ---------------------------------------------------------------------
create or replace function public.mark_cod_payment_collected(
  p_order_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_order public.orders;
  v_payment_id uuid;
begin
  select exists (select 1 from public.admin_users where auth_user_id = auth.uid()) into v_is_admin;
  if not v_is_admin then
    raise exception 'NOT_AUTHORIZED';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if v_order.id is null then
    raise exception 'ORDER_NOT_FOUND';
  end if;

  if v_order.payment_method <> 'Cash on Delivery' then
    raise exception 'NOT_COD_ORDER';
  end if;
  if v_order.payment_status = 'Paid' then
    raise exception 'ALREADY_PAID';
  end if;

  select id into v_payment_id from public.payments
    where order_id = p_order_id and status in ('Pending', 'Authorized')
    order by initiated_at desc
    limit 1
    for update;

  if v_payment_id is null then
    insert into public.payments (order_id, provider, amount, currency, status, confirmed_at)
    values (p_order_id, 'cod', v_order.total_amount, 'INR', 'Paid', now());
  else
    update public.payments
      set status = 'Paid', confirmed_at = now()
      where id = v_payment_id;
  end if;

  update public.orders set payment_status = 'Paid' where id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------
-- Execution grants — explicit, minimal, and written to avoid the exact
-- gap 0009_fix_order_function_permissions.sql had to correct: Supabase
-- grants EXECUTE directly to anon/authenticated/service_role (by role
-- name, not via PUBLIC) the moment a function is created, so every
-- revoke below is spelled out per-role rather than relying on
-- `revoke ... from public` alone.
-- ---------------------------------------------------------------------
revoke all on function public.record_payment_attempt(uuid, text, numeric) from public;
revoke all on function public.record_payment_attempt(uuid, text, numeric) from anon;
grant execute on function public.record_payment_attempt(uuid, text, numeric) to authenticated;

revoke all on function public.mark_cod_payment_collected(uuid) from public;
revoke all on function public.mark_cod_payment_collected(uuid) from anon;
grant execute on function public.mark_cod_payment_collected(uuid) to authenticated;

-- confirm_payment / mark_payment_failed: service_role ONLY. Neither
-- anon nor authenticated may ever call these — there is no browser
-- context, admin or customer, that should be able to.
revoke all on function public.confirm_payment(uuid, text) from public;
revoke all on function public.confirm_payment(uuid, text) from anon;
revoke all on function public.confirm_payment(uuid, text) from authenticated;
grant execute on function public.confirm_payment(uuid, text) to service_role;

revoke all on function public.mark_payment_failed(uuid, text) from public;
revoke all on function public.mark_payment_failed(uuid, text) from anon;
revoke all on function public.mark_payment_failed(uuid, text) from authenticated;
grant execute on function public.mark_payment_failed(uuid, text) to service_role;
