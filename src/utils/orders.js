import { addNotification } from './notifications'

// Demo order storage for the frontend-only phase — orders live in
// localStorage instead of a real database for now.
const ORDERS_STORAGE_KEY = 'dairy_orders'

export const ORDER_STATUS_FLOW = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery', 'Delivered']
const ACTIVE_STATUSES = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery']

function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveOrders(orders) {
  localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders))
}

export function getOrders() {
  return loadOrders().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function getOrderByNumber(orderNumber) {
  return loadOrders().find((order) => order.orderNumber === orderNumber)
}

// The next delivery worth showing on Home: today's active order if
// there is one, otherwise the nearest upcoming active order.
export function getNextDelivery() {
  const activeOrders = getOrders().filter((order) => ACTIVE_STATUSES.includes(order.status))
  const todayIso = new Date().toISOString().split('T')[0]

  const todayOrder = activeOrders.find((order) => order.deliveryDate === todayIso)
  if (todayOrder) return todayOrder

  const upcoming = activeOrders
    .filter((order) => order.deliveryDate > todayIso)
    .sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))

  return upcoming[0] ?? null
}

function appendStatusHistory(order, status) {
  const history = order.statusHistory ?? []
  const alreadyLogged = history.length > 0 && history[history.length - 1].status === status
  return alreadyLogged ? history : [...history, { status, at: new Date().toISOString() }]
}

export function updateOrderStatus(orderNumber, status) {
  const orders = loadOrders().map((order) =>
    order.orderNumber === orderNumber
      ? { ...order, status, statusHistory: appendStatusHistory(order, status) }
      : order
  )
  saveOrders(orders)

  if (status === 'Out for Delivery') {
    addNotification('Your order is out for delivery.')
  } else if (status === 'Delivered') {
    addNotification('Your order has been delivered.')
  }

  return getOrders()
}

export function markDeliveryFailed(orderNumber, failureReason) {
  const orders = loadOrders().map((order) =>
    order.orderNumber === orderNumber
      ? { ...order, status: 'Failed', failureReason, statusHistory: appendStatusHistory(order, 'Failed') }
      : order
  )
  saveOrders(orders)
  addNotification('We were unable to deliver your order today.')
  return getOrders()
}

function formatDateStamp(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

// Produces order numbers like DM-20260819-0001, counting up per day.
function generateOrderNumber(existingOrders, now) {
  const stamp = formatDateStamp(now)
  const todaysOrders = existingOrders.filter((order) => order.orderNumber.includes(stamp))
  const sequence = String(todaysOrders.length + 1).padStart(4, '0')
  return `DM-${stamp}-${sequence}`
}

export function createOrder({
  customer,
  address,
  items,
  subtotal,
  deliveryCharge,
  discount,
  grandTotal,
  deliveryDate,
  deliverySlot,
  paymentMethod,
}) {
  const existingOrders = loadOrders()
  const now = new Date()

  const order = {
    orderNumber: generateOrderNumber(existingOrders, now),
    createdAt: now.toISOString(),
    customer,
    address,
    items,
    subtotal,
    deliveryCharge,
    discount,
    grandTotal,
    deliveryDate,
    deliverySlot,
    paymentMethod,
    // Demo logic only: online payment is marked Paid immediately since
    // there's no real payment gateway in this phase.
    paymentStatus: paymentMethod === 'Online Payment' ? 'Paid' : 'Pending',
    status: 'Placed',
    statusHistory: [{ status: 'Placed', at: now.toISOString() }],
  }

  saveOrders([...existingOrders, order])
  addNotification(`Your delivery is scheduled for ${deliverySlot} on ${deliveryDate}.`)
  return order
}
