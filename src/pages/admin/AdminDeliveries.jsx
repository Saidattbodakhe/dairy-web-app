import { useState } from 'react'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import { getOrders, updateOrderStatus, markDeliveryFailed } from '../../utils/orders'

const failureReasons = [
  'Customer unavailable',
  'Wrong address',
  'Phone unreachable',
  'Payment issue',
  'Other',
]

function AdminDeliveries() {
  const [orders, setOrders] = useState(getOrders)
  const [failureTarget, setFailureTarget] = useState(null)
  const [selectedReason, setSelectedReason] = useState(failureReasons[0])

  const todayIso = new Date().toISOString().split('T')[0]
  const activeOrders = orders.filter(
    (order) => order.status !== 'Cancelled' && order.status !== 'Delivered'
  )
  const todaysDeliveries = activeOrders.filter((order) => order.deliveryDate === todayIso)
  const upcomingDeliveries = activeOrders.filter((order) => order.deliveryDate > todayIso)

  function setStatus(orderNumber, status) {
    setOrders(updateOrderStatus(orderNumber, status))
  }

  function openFailureModal(orderNumber) {
    setSelectedReason(failureReasons[0])
    setFailureTarget(orderNumber)
  }

  function confirmFailure() {
    setOrders(markDeliveryFailed(failureTarget, selectedReason))
    setFailureTarget(null)
  }

  function renderDeliveryCard(order) {
    return (
      <div className="card-plain p-3 mb-3" key={order.orderNumber}>
        <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
          <div>
            <div className="fw-bold">{order.customer.name}</div>
            <div className="text-muted small">{order.customer.phone}</div>
          </div>
          <StatusBadge status={order.status} />
        </div>

        <div className="text-muted small mb-2">
          <i className="bi bi-geo-alt me-1"></i>
          {order.address.line1}, {order.address.city} - {order.address.pincode}
        </div>

        <div className="small mb-2">
          {order.items
            .map((item) => `${item.productName} (${item.variantName}) × ${item.quantity}`)
            .join(', ')}
        </div>

        <div className="small text-muted mb-3">
          {order.deliverySlot} &middot; {order.paymentMethod}
        </div>

        {order.status === 'Failed' && order.failureReason && (
          <div className="text-danger small mb-2">
            <i className="bi bi-exclamation-circle me-1"></i>
            {order.failureReason}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2">
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setStatus(order.orderNumber, 'Preparing')}
          >
            Preparing
          </button>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={() => setStatus(order.orderNumber, 'Out for Delivery')}
          >
            Out for Delivery
          </button>
          <button
            type="button"
            className="btn btn-outline-success btn-sm"
            onClick={() => setStatus(order.orderNumber, 'Delivered')}
          >
            Delivered
          </button>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm"
            onClick={() => openFailureModal(order.orderNumber)}
          >
            Failed
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-4">Deliveries</h1>

      <h2 className="h5 mb-3">Today's Deliveries</h2>
      {todaysDeliveries.length === 0 ? (
        <p className="text-muted mb-4">No deliveries scheduled for today.</p>
      ) : (
        <div className="mb-4">{todaysDeliveries.map(renderDeliveryCard)}</div>
      )}

      <h2 className="h5 mb-3">Upcoming Deliveries</h2>
      {upcomingDeliveries.length === 0 ? (
        <p className="text-muted">No upcoming deliveries.</p>
      ) : (
        <div>{upcomingDeliveries.map(renderDeliveryCard)}</div>
      )}

      {failureTarget && (
        <Modal title="Mark Delivery Failed" onClose={() => setFailureTarget(null)}>
          <label className="form-label" htmlFor="failureReason">Reason</label>
          <select
            id="failureReason"
            className="form-select mb-3"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
          >
            {failureReasons.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
          <div className="d-flex gap-2">
            <button type="button" className="btn btn-brand flex-grow-1" onClick={confirmFailure}>
              Confirm
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => setFailureTarget(null)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default AdminDeliveries
