// Demo subscription storage for the frontend-only phase — no backend
// or scheduling actually runs yet, this just lets the UI feel real.
const SUBSCRIPTIONS_STORAGE_KEY = 'dairy_subscriptions'

const exampleSubscription = {
  id: 'SUB-DEMO-0001',
  productId: '1',
  productName: 'Fresh Cow Milk',
  variantId: '1-2',
  variantName: '1 litre',
  price: 58,
  frequency: 'Daily',
  selectedDays: [],
  quantity: 1,
  startDate: '2026-08-01',
  endDate: '',
  deliverySlot: '6:00 AM – 8:00 AM',
  address: 'Home — 123 Demo Street, Sample City',
  status: 'Active',
  nextDeliverySkipped: false,
}

function loadSubscriptions() {
  try {
    const raw = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY)
    if (!raw) {
      saveSubscriptions([exampleSubscription])
      return [exampleSubscription]
    }
    return JSON.parse(raw)
  } catch {
    return [exampleSubscription]
  }
}

function saveSubscriptions(subscriptions) {
  localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(subscriptions))
}

export function getSubscriptions() {
  return loadSubscriptions()
}

export function createSubscription(data) {
  const subscriptions = loadSubscriptions()
  const newSubscription = {
    id: `SUB-${String(subscriptions.length + 1).padStart(4, '0')}`,
    ...data,
    status: 'Active',
    nextDeliverySkipped: false,
  }

  saveSubscriptions([...subscriptions, newSubscription])
  return newSubscription
}

export function updateSubscription(id, changes) {
  const subscriptions = loadSubscriptions().map((subscription) =>
    subscription.id === id ? { ...subscription, ...changes } : subscription
  )
  saveSubscriptions(subscriptions)
  return subscriptions
}
