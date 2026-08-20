// Mock dashboard numbers for the frontend-only phase — these will be
// replaced by real aggregated data once the backend exists.
export const summaryStats = [
  { label: "Today's Orders", value: '42', icon: 'bi-receipt' },
  { label: "Today's Sales", value: '₹4,850', icon: 'bi-cash-coin' },
  { label: 'Milk Produced', value: '100 L', icon: 'bi-droplet-fill' },
  { label: 'Milk Required', value: '78 L', icon: 'bi-droplet-half' },
  { label: 'Available Milk', value: '22 L', icon: 'bi-droplet' },
  { label: 'Pending Deliveries', value: '8', icon: 'bi-truck' },
  { label: 'Active Customers', value: '156', icon: 'bi-people-fill' },
  { label: 'Pending Payments', value: '₹1,240', icon: 'bi-exclamation-circle' },
]

export const orderStatusSummary = [
  { status: 'Placed', count: 6 },
  { status: 'Confirmed', count: 10 },
  { status: 'Preparing', count: 8 },
  { status: 'Out for Delivery', count: 8 },
  { status: 'Delivered', count: 9 },
  { status: 'Cancelled', count: 1 },
]

export const milkPosition = {
  production: 100,
  subscriptions: 60,
  oneTimeOrders: 18,
  available: 22,
}

export const deliverySlotPositions = [
  { slot: '6:00 AM – 8:00 AM', booked: 14, capacity: 20 },
  { slot: '8:00 AM – 10:00 AM', booked: 18, capacity: 20 },
  { slot: '5:00 PM – 7:00 PM', booked: 6, capacity: 15 },
]

export const actionRequired = [
  { label: 'Failed Payments', count: 2, icon: 'bi-credit-card-2-front', link: '/admin/orders' },
  { label: 'Delivery Failures', count: 3, icon: 'bi-truck', link: '/admin/deliveries' },
  { label: 'Low Stock Items', count: 2, icon: 'bi-box-seam', link: '/admin/inventory' },
]
