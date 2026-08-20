// Saved delivery addresses, stored in localStorage. Shape matches
// Checkout's address fields so the same address can be reused there,
// in Subscription, and managed from Profile.
const ADDRESSES_STORAGE_KEY = 'dairy_saved_addresses'

const seedAddresses = [
  {
    id: 'ADDR-0001',
    label: 'Home',
    line1: '123 Demo Street',
    line2: '',
    landmark: 'Near Community Park',
    city: 'Sample City',
    state: 'Sample State',
    pincode: '400001',
  },
]

function loadAddresses() {
  try {
    const raw = localStorage.getItem(ADDRESSES_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
    saveAddresses(seedAddresses)
    return seedAddresses
  } catch {
    return seedAddresses
  }
}

function saveAddresses(addresses) {
  localStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(addresses))
}

export function getAddresses() {
  return loadAddresses()
}

export function addAddress(addressData) {
  const addresses = loadAddresses()
  const newAddress = { ...addressData, id: `ADDR-${String(addresses.length + 1).padStart(4, '0')}` }
  const updated = [...addresses, newAddress]
  saveAddresses(updated)
  return updated
}

export function removeAddress(addressId) {
  const updated = loadAddresses().filter((address) => address.id !== addressId)
  saveAddresses(updated)
  return updated
}

export function formatAddress(address) {
  const parts = [
    address.line1,
    address.line2,
    address.landmark ? `Near ${address.landmark}` : '',
    `${address.city}, ${address.state} - ${address.pincode}`,
  ].filter(Boolean)

  return `${address.label} — ${parts.join(', ')}`
}
