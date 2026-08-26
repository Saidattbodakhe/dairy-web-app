import { supabase } from '../lib/supabaseClient'

// confirm_payment and mark_payment_failed are service_role-only RPCs —
// deliberately NOT wrapped here. There is no browser context, admin or
// customer, that should ever be able to call them, so no function in
// this file even attempts to.

const PAYMENT_SELECT =
  'id, order_id, provider, provider_reference_id, amount, currency, status, failure_reason, initiated_at, confirmed_at'

function mapPaymentRow(row) {
  return {
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    providerReferenceId: row.provider_reference_id,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    failureReason: row.failure_reason,
    initiatedAt: row.initiated_at,
    confirmedAt: row.confirmed_at,
  }
}

// Every RAISE EXCEPTION code from 0010_payment_foundation.sql, mapped
// to a customer-safe message — nothing here ever surfaces a raw
// PostgreSQL/PostgREST error.
function friendlyPaymentError(error) {
  const msg = error?.message || ''

  if (/ORDER_NOT_FOUND/.test(msg)) return 'This order could not be found.'
  if (/ORDER_CANCELLED/.test(msg)) return 'This order has been cancelled.'
  if (/ORDER_ALREADY_DELIVERED/.test(msg)) return 'This order has already been delivered.'
  if (/ORDER_ALREADY_PAID/.test(msg)) return 'This order has already been paid.'
  if (/INVALID_PROVIDER/.test(msg)) return 'Please choose a valid payment provider.'
  if (/AMOUNT_MISMATCH/.test(msg)) return 'The payment amount does not match this order. Please refresh and try again.'
  if (/CUSTOMER_NOT_FOUND/.test(msg)) return 'We could not verify your account. Please log in again.'
  if (/NOT_AUTHORIZED/.test(msg)) return 'You are not authorized to perform this action.'
  if (/NOT_COD_ORDER/.test(msg)) return 'This order is not a Cash on Delivery order.'
  if (/ALREADY_PAID/.test(msg)) return 'This order has already been marked as paid.'
  if (/PAYMENT_NOT_FOUND/.test(msg)) return 'This payment could not be found.'
  if (/PAYMENT_ALREADY_FINALIZED/.test(msg)) return 'This payment has already been finalized.'

  return 'Something went wrong. Please try again.'
}

// Customer-initiated — creates a Pending payment attempt for the
// customer's own order. amount is re-validated against
// orders.total_amount server-side inside the RPC; nothing the caller
// supplies here is trusted for pricing. Never marks anything Paid.
export async function recordPaymentAttempt({ orderId, provider, amount }) {
  const { data, error } = await supabase.rpc('record_payment_attempt', {
    p_order_id: orderId,
    p_provider: provider,
    p_amount: amount,
  })

  if (error) {
    console.error('recordPaymentAttempt failed:', error.message)
    throw new Error(friendlyPaymentError(error))
  }

  return {
    id: data.id,
    orderId: data.order_id,
    provider: data.provider,
    amount: Number(data.amount),
    status: data.status,
  }
}

// RLS ("payments_select_own" / "payments_select_all_admin") restricts
// this to the signed-in customer's own order, or any order for an
// admin session — no ownership filter is passed or needed here.
export async function getOrderPayments(orderId) {
  const { data, error } = await supabase
    .from('payments')
    .select(PAYMENT_SELECT)
    .eq('order_id', orderId)
    .order('initiated_at', { ascending: false })

  if (error) {
    console.error('getOrderPayments failed:', error.message)
    throw new Error('Unable to load payment information. Please try again.')
  }
  return (data ?? []).map(mapPaymentRow)
}

// Admin-only — the mark_cod_payment_collected RPC itself verifies the
// caller against admin_users; this is not merely a frontend check.
export async function markCodPaymentCollected(orderId) {
  const { error } = await supabase.rpc('mark_cod_payment_collected', { p_order_id: orderId })
  if (error) {
    console.error('markCodPaymentCollected failed:', error.message)
    throw new Error(friendlyPaymentError(error))
  }
}
