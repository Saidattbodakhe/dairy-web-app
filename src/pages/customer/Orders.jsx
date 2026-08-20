import { Link, useNavigate } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { getOrders } from '../../utils/orders'
import { useProducts } from '../../context/ProductContext'

function Orders() {
  const { customer, isLoggedIn, isLoading } = useAuth()
  const { addItem } = useCart()
  const { getProductById } = useProducts()
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  // /orders is customer-only — same login requirement as Profile and
  // Subscription.
  if (!isLoggedIn) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-person-circle fs-1 text-muted d-block mb-3"></i>
        <h1>You're not logged in</h1>
        <p className="text-muted">Log in to see your orders.</p>
        <Link to="/login" className="btn btn-brand">Login</Link>
      </div>
    )
  }

  const orders = getOrders()

  // Adds an old order's items back to the cart at TODAY's mock prices,
  // not the price the customer paid before. Anything that no longer
  // exists in the product catalog is skipped instead of breaking.
  function handleReorder(order) {
    order.items.forEach((item) => {
      const product = getProductById(item.productId)
      if (!product) return

      const variant = product.variants.find(
        (candidate) => candidate.id === item.variantId && candidate.isActive
      )
      if (!variant) return

      addItem(product, variant, item.quantity)
    })

    navigate('/cart')
  }

  return (
    <div className="container py-4 py-md-5">
      <div className="mb-4">
        <h1 className="mb-1">Welcome Back{customer?.name ? `, ${customer.name}` : ''}</h1>
        <p className="text-muted mb-0">Manage your orders, subscription, and rewards in one place.</p>
      </div>

      <h2 className="h4 mb-3">Recent Orders</h2>

      {orders.length === 0 ? (
        <div className="card-plain p-5 text-center">
          <i className="bi bi-receipt fs-1 text-muted d-block mb-3"></i>
          <p className="text-muted mb-0">You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {orders.map((order) => (
            <div className="card-plain p-4" key={order.orderNumber}>
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-3">
                <div>
                  <div className="fw-bold">{order.orderNumber}</div>
                  <div className="text-muted small">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <StatusBadge status={order.status} />
                  <StatusBadge status={order.paymentStatus} />
                </div>
              </div>

              <div className="text-muted small mb-3">
                {order.items
                  .map((item) => `${item.productName} (${item.variantName}) × ${item.quantity}`)
                  .join(', ')}
              </div>

              <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                <div className="small">
                  <span className="text-muted">Delivery: </span>
                  {order.deliveryDate} &middot; {order.deliverySlot}
                </div>
                <div className="fw-bold">₹{order.grandTotal}</div>
              </div>

              <div className="d-flex gap-2">
                <Link to={`/orders/${order.orderNumber}`} className="btn btn-outline-secondary btn-sm">
                  View Details
                </Link>
                <button type="button" className="btn btn-brand btn-sm" onClick={() => handleReorder(order)}>
                  Reorder
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Orders
