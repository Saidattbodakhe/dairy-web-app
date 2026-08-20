import { getOrders } from './orders'
import { getCustomers } from './customers'
import { getProductionEntries } from './production'
import { milkPositionMock, calculateMilkAvailability, LOW_STOCK_THRESHOLD } from './inventory'
import { getSubscriptions } from './subscriptions'

const PENDING_ORDER_STATUSES = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery']

function isSameDay(isoTimestamp, isoDate) {
  return isoTimestamp.split('T')[0] === isoDate
}

export function getSalesReport() {
  const orders = getOrders()
  const todayIso = new Date().toISOString().split('T')[0]
  const now = new Date()

  const dailySales = orders
    .filter((order) => isSameDay(order.createdAt, todayIso))
    .reduce((sum, order) => sum + order.grandTotal, 0)

  const monthlySales = orders
    .filter((order) => {
      const created = new Date(order.createdAt)
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
    })
    .reduce((sum, order) => sum + order.grandTotal, 0)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const weeklySales = orders
    .filter((order) => new Date(order.createdAt) >= sevenDaysAgo)
    .reduce((sum, order) => sum + order.grandTotal, 0)

  const totalRevenue = orders.reduce((sum, order) => sum + order.grandTotal, 0)

  const productTotals = new Map()
  orders.forEach((order) => {
    order.items.forEach((item) => {
      productTotals.set(item.productName, (productTotals.get(item.productName) || 0) + item.quantity)
    })
  })

  const productSales = Array.from(productTotals.entries())
    .map(([productName, quantity]) => ({ productName, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)

  return { dailySales, weeklySales, monthlySales, totalRevenue, productSales }
}

// Business-wide order/delivery/payment counts for Admin View — one
// pass over all orders instead of several near-duplicate functions.
export function getOrderOverview() {
  const orders = getOrders()
  const todayIso = new Date().toISOString().split('T')[0]

  return {
    ordersToday: orders.filter((order) => isSameDay(order.createdAt, todayIso)).length,
    deliveriesToday: orders.filter((order) => order.deliveryDate === todayIso).length,
    scheduled: orders.filter(
      (order) => PENDING_ORDER_STATUSES.includes(order.status) && order.deliveryDate >= todayIso
    ).length,
    outForDelivery: orders.filter((order) => order.status === 'Out for Delivery').length,
    delivered: orders.filter((order) => order.status === 'Delivered').length,
    pending: orders.filter((order) => PENDING_ORDER_STATUSES.includes(order.status)).length,
    cancelled: orders.filter((order) => order.status === 'Cancelled').length,
    failed: orders.filter((order) => order.status === 'Failed').length,
    pendingPayments: orders.filter((order) => order.paymentStatus === 'Pending').length,
  }
}

export function getOrdersReport() {
  const orders = getOrders()
  return {
    total: orders.length,
    delivered: orders.filter((order) => order.status === 'Delivered').length,
    cancelled: orders.filter((order) => order.status === 'Cancelled').length,
    failed: orders.filter((order) => order.status === 'Failed').length,
    pending: orders.filter((order) => PENDING_ORDER_STATUSES.includes(order.status)).length,
  }
}

// One table covers "Best Selling", "Product-wise Sales", "Quantity
// Sold" and "Revenue" at once — they're the same underlying numbers,
// just different labels for the same per-product breakdown.
export function getProductPerformanceReport() {
  const orders = getOrders()
  const performance = new Map()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const existing = performance.get(item.productName) || { quantity: 0, revenue: 0 }
      existing.quantity += item.quantity
      existing.revenue += item.price * item.quantity
      performance.set(item.productName, existing)
    })
  })

  return Array.from(performance.entries())
    .map(([productName, stats]) => ({ productName, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
}

export function getMilkReport() {
  const entries = getProductionEntries()
  const produced = entries[0]?.total ?? 0
  const sold = milkPositionMock.subscriptionDemand + milkPositionMock.oneTimeOrderDemand
  const { available } = calculateMilkAvailability(milkPositionMock)

  return { produced, sold, remaining: available, wastage: milkPositionMock.wastage }
}

export function getCustomersReport() {
  const customers = getCustomers()
  return {
    total: customers.length,
    new: customers.filter((customer) => customer.totalOrders === 1).length,
    repeat: customers.filter((customer) => customer.totalOrders > 1).length,
  }
}

export function getSubscriptionReport() {
  const subscriptions = getSubscriptions()

  const demandByProduct = new Map()
  subscriptions
    .filter((subscription) => subscription.status === 'Active')
    .forEach((subscription) => {
      demandByProduct.set(
        subscription.productName,
        (demandByProduct.get(subscription.productName) || 0) + subscription.quantity
      )
    })

  const productDemand = Array.from(demandByProduct.entries())
    .map(([productName, quantity]) => ({ productName, quantity }))
    .sort((a, b) => b.quantity - a.quantity)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const newSubscribers = subscriptions.filter(
    (subscription) => subscription.startDate && new Date(subscription.startDate) >= sevenDaysAgo
  ).length

  return {
    active: subscriptions.filter((s) => s.status === 'Active').length,
    paused: subscriptions.filter((s) => s.status === 'Paused').length,
    cancelled: subscriptions.filter((s) => s.status === 'Cancelled').length,
    newSubscribers,
    productDemand,
  }
}

// `products` is passed in (from the centralized ProductContext) rather
// than read internally, since this is a plain utility module and
// products now live in React Context, not a standalone localStorage
// reader like the other utils in this file.
export function getInventoryReport(products) {
  let currentStock = 0
  let lowStockCount = 0
  let outOfStockCount = 0

  products.forEach((product) => {
    product.variants
      .filter((variant) => variant.isActive)
      .forEach((variant) => {
        currentStock += variant.stock
        if (variant.stock === 0) outOfStockCount += 1
        else if (variant.stock < LOW_STOCK_THRESHOLD) lowStockCount += 1
      })
  })

  return { currentStock, lowStockCount, outOfStockCount }
}
