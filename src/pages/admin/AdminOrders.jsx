import { Fragment, useState } from 'react'
import StatusBadge from '../../components/StatusBadge'
import { ORDER_STATUS_FLOW, getOrders, updateOrderStatus } from '../../utils/orders'

const paymentStatuses = ['Paid', 'Pending', 'Failed']
const allStatuses = [...ORDER_STATUS_FLOW, 'Cancelled', 'Failed']

function AdminOrders() {
  const [orders, setOrders] = useState(getOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [paymentFilter, setPaymentFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('')
  const [expandedOrderNumber, setExpandedOrderNumber] = useState(null)

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

  function handleStatusChange(orderNumber, status) {
    setOrders(updateOrderStatus(orderNumber, status))
  }

  function handleCancel(orderNumber) {
    if (window.confirm(`Cancel order ${orderNumber}?`)) {
      setOrders(updateOrderStatus(orderNumber, 'Cancelled'))
    }
  }

  function toggleExpanded(orderNumber) {
    setExpandedOrderNumber((current) => (current === orderNumber ? null : orderNumber))
  }

  return (
    <div>
      <h1 className="mb-4">Orders</h1>

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

      {filteredOrders.length === 0 ? (
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
                {filteredOrders.map((order) => (
                  <Fragment key={order.orderNumber}>
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
                          onChange={(e) => handleStatusChange(order.orderNumber, e.target.value)}
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
                            onClick={() => toggleExpanded(order.orderNumber)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            disabled={order.status === 'Cancelled'}
                            onClick={() => handleCancel(order.orderNumber)}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedOrderNumber === order.orderNumber && (
                      <tr>
                        <td colSpan="8" className="bg-light-subtle">
                          <div className="p-2">
                            <div className="fw-semibold mb-1">Items</div>
                            {order.items.map((item) => (
                              <div
                                className="d-flex justify-content-between small"
                                key={`${item.productId}-${item.variantId}`}
                              >
                                <span>{item.productName} ({item.variantName}) × {item.quantity}</span>
                                <span>₹{item.price * item.quantity}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOrders
