import { getOrders } from './orders'

// There's no separate customer database yet, so "customers" are built
// by grouping real demo orders by phone number. Placing an order as a
// customer is what makes them show up here.
export function getCustomers() {
  const orders = getOrders()
  const customersByPhone = new Map()

  orders.forEach((order) => {
    const key = order.customer.phone
    const existing = customersByPhone.get(key)

    if (existing) {
      existing.totalOrders += 1
      existing.totalSpend += order.grandTotal
      if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
        existing.name = order.customer.name
        existing.email = order.customer.email
        existing.lastOrderAt = order.createdAt
      }
    } else {
      customersByPhone.set(key, {
        phone: order.customer.phone,
        name: order.customer.name,
        email: order.customer.email,
        totalOrders: 1,
        totalSpend: order.grandTotal,
        lastOrderAt: order.createdAt,
        status: 'Active',
      })
    }
  })

  return Array.from(customersByPhone.values()).sort(
    (a, b) => new Date(b.lastOrderAt) - new Date(a.lastOrderAt)
  )
}

export function getCustomerOrders(phone) {
  return getOrders().filter((order) => order.customer.phone === phone)
}
