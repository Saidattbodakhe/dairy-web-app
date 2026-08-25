import { Fragment, useEffect, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import {
  ORDER_STATUS_FLOW,
  getAdminOrders,
  updateAdminOrderStatus,
  cancelAdminOrder,
} from '../../services/orderService'

const paymentStatuses = ['Paid', 'Pending', 'Failed']
const allStatuses = [...ORDER_STATUS_FLOW, 'Cancelled']
// An order in one of these statuses has no valid next step left —
// matches update_order_status()/cancel_order()'s rules in
// 0008_order_functions.sql, so the UI doesn't offer actions the
// database would reject anyway.
const TERMINAL_STATUSES = ['Delivered', 'Cancelled']

function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [actionError, setActionError] = useState('')

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [expandedOrderId, setExpandedOrderId] = useState(null)

  async function loadOrders() {
    setIsLoading(true)
    try {
      const fetched = await getAdminOrders()
      setOrders(fetched)
      setLoadError('')
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    let isMounted = true
    async function initialLoad() {
      setIsLoading(true)
      try {
        const fetched = await getAdminOrders()
        if (!isMounted) return
        setOrders(fetched)
        setLoadError('')
      } catch (err) {
        if (isMounted) setLoadError(err.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }
    initialLoad()
    return () => {
      isMounted = false
    }
  }, [])

  const filteredOrders = orders.filter((order) => {
    const term = search.trim().toLowerCase()
    const matchesSearch =
      term === '' ||
      order.orderNumber.toLowerCase().includes(term) ||
      order.customer.name.toLowerCase().includes(term) ||
      order.customer.phone.includes(term)

    const matchesStatus = statusFilter === 'All' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'All' || order.paymentStatus === paymentFilter
    const matchesDate = !dateFilter || order.deliveryDate === dateFilter

    return matchesSearch && matchesStatus && matchesPayment && matchesDate
  })

  async function handleStatusChange(orderId, status) {
    setActionError('')
    try {
      await updateAdminOrderStatus(orderId, status)
      await loadOrders()
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleCancel(order) {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return

    setActionError('')
    try {
      await cancelAdminOrder(order.id)
      await loadOrders()
    } catch (err) {
      setActionError(err.message)
    }
  }

  function toggleExpanded(orderId) {
    setExpandedOrderId((current) => (current === orderId ? null : orderId))
  }

  return (
    <div>
      <h1 className="mb-4">Orders</h1>

      {actionError && <div className="alert alert-danger">{actionError}</div>}

      <div className="card-plain p-3 mb-4">
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <input
              type="search"
              className="form-control"
              placeholder="Search order #, name, or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              {allStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <select
              className="form-select"
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
            >
              <option value="All">All Payments</option>
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          <div className="col-12 col-md-3">
            <input
              type="date"
              className="form-control"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              title="Filter by delivery date"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : loadError ? (
        <div className="alert alert-danger">{loadError}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-inbox fs-1 d-block mb-2"></i>
          No orders found.
        </div>
      ) : (
        <div className="card-plain p-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Delivery</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const isTerminal = TERMINAL_STATUSES.includes(order.status)

                  return (
                    <Fragment key={order.id}>
                      <tr>
                        <td className="fw-semibold">{order.orderNumber}</td>
                        <td>{order.customer.name}</td>
                        <td>{order.customer.phone}</td>
                        <td>₹{order.grandTotal}</td>
                        <td><StatusBadge status={order.paymentStatus} /></td>
                        <td className="small">
                          {order.deliveryDate}
                          <br />
                          <span className="text-muted">{order.deliverySlot}</span>
                        </td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            style={{ minWidth: '150px' }}
                            value={order.status}
                            disabled={isTerminal}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          >
                            {allStatuses.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => toggleExpanded(order.id)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              disabled={isTerminal}
                              onClick={() => handleCancel(order)}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>

                      {expandedOrderId === order.id && (
                        <tr>
                          <td colSpan="8" className="bg-light-subtle">
                            <div className="p-2">
                              <div className="fw-semibold mb-1">Items</div>
                              {order.items.map((item) => (
                                <div className="d-flex justify-content-between small" key={item.id}>
                                  <span>{item.productName} ({item.variantName}) × {item.quantity}</span>
                                  <span>₹{item.lineTotal}</span>
                                </div>
                              ))}
                              <div className="fw-semibold mt-2 mb-1">Delivery Address</div>
                              <div className="small text-muted">
                                {order.address.line1}
                                {order.address.line2 ? `, ${order.address.line2}` : ''}, {order.address.city},{' '}
                                {order.address.state} - {order.address.pincode}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
