import { supabase } from '../lib/supabaseClient'

const ADDRESS_SELECT = 'id, label, line1, line2, landmark, city, state, pincode, phone, is_default'

function mapAddressRow(row) {
  return {
    id: row.id,
    label: row.label,
    line1: row.line1,
    line2: row.line2,
    landmark: row.landmark,
    city: row.city,
    state: row.state,
    pincode: row.pincode,
    phone: row.phone,
    isDefault: row.is_default,
  }
}

// RLS ("customers_select_own") already restricts this to exactly the
// signed-in customer's own row, so no auth_user_id filter is needed —
// the same pattern AuthContext.ensureCustomerProfile relies on.
async function getOwnCustomerId() {
  const { data, error } = await supabase.from('customers').select('id').single()
  if (error || !data) throw new Error('Please log in again to manage addresses.')
  return data.id
}

function friendlyAddressError(error) {
  const msg = error?.message || ''
  if (/row-level security|permission denied/i.test(msg)) {
    return 'You are not allowed to modify this address.'
  }
  if (/PGRST116/.test(error?.code || '')) {
    return 'This address could not be found.'
  }
  return 'Something went wrong. Please try again.'
}

// Used by Checkout and Profile — RLS ("customer_addresses_select_own")
// guarantees this only ever returns the signed-in customer's own
// addresses, never anyone else's.
export async function getCustomerAddresses() {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select(ADDRESS_SELECT)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getCustomerAddresses failed:', error.message)
    throw new Error('Unable to load your saved addresses. Please try again.')
  }
  return (data ?? []).map(mapAddressRow)
}

// customer_id is resolved server-side from the authenticated session,
// never accepted from the caller — the insert policy would reject a
// mismatched customer_id anyway, but this also means a caller can
// never even attempt to name someone else's customer_id.
export async function createCustomerAddress(addressData) {
  const customerId = await getOwnCustomerId()

  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      customer_id: customerId,
      label: addressData.label,
      line1: addressData.line1,
      line2: addressData.line2 || '',
      landmark: addressData.landmark || '',
      city: addressData.city,
      state: addressData.state,
      pincode: addressData.pincode,
      phone: addressData.phone || '',
      is_default: Boolean(addressData.isDefault),
    })
    .select(ADDRESS_SELECT)
    .single()

  if (error) {
    console.error('createCustomerAddress failed:', error.message)
    throw new Error(friendlyAddressError(error))
  }
  return mapAddressRow(data)
}

// No customer_id in the update payload — ownership is enforced purely
// by the "customer_addresses_update_own" RLS policy matching on `id`.
export async function updateCustomerAddress(addressId, addressData) {
  const { data, error } = await supabase
    .from('customer_addresses')
    .update({
      label: addressData.label,
      line1: addressData.line1,
      line2: addressData.line2 || '',
      landmark: addressData.landmark || '',
      city: addressData.city,
      state: addressData.state,
      pincode: addressData.pincode,
      phone: addressData.phone || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', addressId)
    .select(ADDRESS_SELECT)
    .single()

  if (error) {
    console.error('updateCustomerAddress failed:', error.message)
    throw new Error(friendlyAddressError(error))
  }
  return mapAddressRow(data)
}

export async function deleteCustomerAddress(addressId) {
  const { error } = await supabase.from('customer_addresses').delete().eq('id', addressId)
  if (error) {
    console.error('deleteCustomerAddress failed:', error.message)
    throw new Error(friendlyAddressError(error))
  }
}

// The "one default per customer" invariant is enforced server-side
// (trg_enforce_single_default_address in 0007_orders_backend.sql) —
// this just flips is_default on for one row and lets the trigger
// unset any previous default.
export async function setDefaultCustomerAddress(addressId) {
  const { data, error } = await supabase
    .from('customer_addresses')
    .update({ is_default: true, updated_at: new Date().toISOString() })
    .eq('id', addressId)
    .select(ADDRESS_SELECT)
    .single()

  if (error) {
    console.error('setDefaultCustomerAddress failed:', error.message)
    throw new Error(friendlyAddressError(error))
  }
  return mapAddressRow(data)
}
