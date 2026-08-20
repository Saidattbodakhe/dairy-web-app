const INTEREST_STORAGE_KEY = 'dairy_product_interest'

// "Notify Me" on the Home page's Featured Products Coming Soon teaser —
// just a list of product names the customer tapped, kept in
// localStorage like the rest of this frontend-only demo. No backend
// notification is sent.
function loadInterest() {
  try {
    const raw = localStorage.getItem(INTEREST_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function getProductInterest() {
  return loadInterest()
}

export function addProductInterest(productName) {
  const current = loadInterest()
  if (current.includes(productName)) return current

  const updated = [...current, productName]
  localStorage.setItem(INTEREST_STORAGE_KEY, JSON.stringify(updated))
  return updated
}
