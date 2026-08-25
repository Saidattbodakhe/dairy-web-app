import { supabase } from '../lib/supabaseClient'

// Matches the CHECK constraint on orders.status in
// 0007_orders_backend.sql — 'Cancelled' is intentionally excluded here
// since it isn't a forward step in the delivery flow.
export const ORDER_STATUS_FLOW = ['Pending', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered']

const ORDER_SELECT = `
  id, order_number, status, payment_method, payment_status,
  subtotal, discount, delivery_charge, total_amount,
  delivery_address_snapshot, delivery_date, delivery_slot,
  placed_at, created_at, updated_at,
  customers ( name, phone, email ),
  order_items ( id, product_id, variant_id, product_name_snapshot, variant_name_snapshot,
    quantity_value_snapshot, unit_snapshot, unit_price, quantity, line_total )
`

function mapOrderItemRow(item) {
  return {
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id,
    productName: item.product_name_snapshot,
    variantName: item.variant_name_snapshot,
    quantityValue: item.quantity_value_snapshot,
    unit: item.unit_snapshot,
    price: Number(item.unit_price),
    quantity: item.quantity,
    lineTotal: Number(item.line_total),
  }
}

// Maps a Supabase orders row (+ joined customers/order_items) into the
// same flat shape the existing Orders/OrderDetail/AdminOrders UI already
// expected from the old localStorage order object, so those pages keep
// working with only their data source swapped.
function mapOrderRow(row) {
  const address = row.delivery_address_snapshot || {}
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    deliveryCharge: Number(row.delivery_charge),
    grandTotal: Number(row.total_amount),
    deliveryDate: row.delivery_date,
    deliverySlot: row.delivery_slot,
    createdAt: row.placed_at ?? row.created_at,
    customer: {
      name: row.customers?.name ?? '',
      phone: row.customers?.phone ?? address.phone ?? '',
      email: row.customers?.email ?? '',
    },
    address: {
      label: address.label ?? '',
      line1: address.line1 ?? '',
      line2: address.line2 ?? '',
      landmark: address.landmark ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      pincode: address.pincode ?? '',
    },
    items: (row.order_items ?? []).map(mapOrderItemRow),
  }
}

// Every RAISE EXCEPTION code raised by create_order/update_order_status/
// cancel_order in 0008_order_functions.sql, mapped to a customer-safe
// message — nothing here ever surfaces a raw PostgreSQL/PostgREST error.
function friendlyOrderError(error) {
  const msg = error?.message || ''

  if (/INSUFFICIENT_STOCK/.test(msg)) return 'Some items are no longer available in the requested quantity.'
  if (/VARIANT_UNAVAILABLE/.test(msg)) return 'This product is currently unavailable.'
  if (/VARIANT_NOT_FOUND/.test(msg)) return 'One of the items in your cart is no longer available.'
  if (/BELOW_MIN_ORDER_QTY/.test(msg)) return 'Some items are below the minimum order quantity allowed.'
  if (/ABOVE_MAX_ORDER_QTY/.test(msg)) return 'Some items are above the maximum order quantity allowed.'
  if (/INVALID_QUANTITY/.test(msg)) return 'Please check the quantities in your cart.'
  if (/ADDRESS_NOT_FOUND/.test(msg)) return 'Please select a valid delivery address.'
  if (/EMPTY_CART/.test(msg)) return 'Your cart is empty.'
  if (/INVALID_PAYMENT_METHOD/.test(msg)) return 'Please choose a valid payment method.'
  if (/CUSTOMER_NOT_FOUND/.test(msg)) return 'We could not verify your account. Please log in again.'
  if (/CANNOT_CANCEL_AT_THIS_STAGE/.test(msg)) return 'This order can no longer be cancelled.'
  if (/USE_CANCEL_ORDER_FUNCTION/.test(msg)) return 'This order can no longer be cancelled.'
  if (/INVALID_TRANSITION/.test(msg)) return 'That status change is not allowed for this order.'
  if (/INVALID_STATUS/.test(msg)) return 'That is not a valid order status.'
  if (/ORDER_NOT_FOUND/.test(msg)) return 'This order could not be found.'
  if (/NOT_AUTHORIZED/.test(msg)) return 'You are not authorized to perform this action.'

  return 'Something went wrong. Please try again.'
}

// The only way an order is ever created — delegates entirely to the
// create_order RPC, which resolves the real customer, re-validates
// price/stock/address server-side, and returns the authoritative totals.
// `items`: [{ variantId, quantity }], built from the cart.
export async function createOrder({ items, addressId, deliveryDate, deliverySlot, paymentMethod }) {
  const { data, error } = await supabase.rpc('create_order', {
    p_items: items.map((item) => ({ variant_id: item.variantId, quantity: item.quantity })),
    p_address_id: addressId,
    p_delivery_date: deliveryDate,
    p_delivery_slot: deliverySlot,
    p_payment_method: paymentMethod,
  })

  if (error) {
    console.error('createOrder failed:', error.message)
    throw new Error(friendlyOrderError(error))
  }

  return {
    id: data.id,
    orderNumber: data.order_number,
    subtotal: Number(data.subtotal),
    deliveryCharge: Number(data.delivery_charge),
    totalAmount: Number(data.total_amount),
  }
}

// RLS ("orders_select_own") restricts this to the signed-in customer's
// own orders — no customer_id filter is passed or needed.
export async function getCustomerOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('placed_at', { ascending: false })

  if (error) {
    console.error('getCustomerOrders failed:', error.message)
    throw new Error('Unable to load your orders. Please try again.')
  }
  return (data ?? []).map(mapOrderRow)
}

// `orderId` is the orders.id UUID (not the human order_number) — RLS
// decides visibility, so a customer requesting someone else's order id
// simply gets no row back, never another customer's data.
export async function getCustomerOrderById(orderId) {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .maybeSingle()

  if (error) {
    console.error('getCustomerOrderById failed:', error.message)
    throw new Error('Unable to load this order. Please try again.')
  }
  return data ? mapOrderRow(data) : null
}

export async function cancelCustomerOrder(orderId) {
  const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
  if (error) {
    console.error('cancelCustomerOrder failed:', error.message)
    throw new Error(friendlyOrderError(error))
  }
}

// Admin — same table/columns as getCustomerOrders, but returns every
// customer's orders because "orders_select_all_admin" (not a frontend
// flag) grants that visibility only to a real admin_users session.
export async function getAdminOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .order('placed_at', { ascending: false })

  if (error) {
    console.error('getAdminOrders failed:', error.message)
    throw new Error('Unable to load orders. Please try again.')
  }
  return (data ?? []).map(mapOrderRow)
}

export async function updateAdminOrderStatus(orderId, newStatus) {
  const { error } = await supabase.rpc('update_order_status', {
    p_order_id: orderId,
    p_new_status: newStatus,
  })
  if (error) {
    console.error('updateAdminOrderStatus failed:', error.message)
    throw new Error(friendlyOrderError(error))
  }
}

export async function cancelAdminOrder(orderId) {
  const { error } = await supabase.rpc('cancel_order', { p_order_id: orderId })
  if (error) {
    console.error('cancelAdminOrder failed:', error.message)
    throw new Error(friendlyOrderError(error))
  }
}
