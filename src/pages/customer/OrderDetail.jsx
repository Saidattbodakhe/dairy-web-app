import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import StarRating from '../../components/StarRating'
import DeliveryTracker from '../../components/DeliveryTracker'
import {
  ORDER_STATUS_FLOW,
  getCustomerOrderById,
  getOrderStatusHistory,
  cancelCustomerOrder,
} from '../../services/orderService'
import { getReviewForOrder, submitReview } from '../../utils/reviews'

// Matches cancel_order()'s customer-side rule in 0008_order_functions.sql
// — a customer may only cancel while the order is still Pending/Confirmed.
const CUSTOMER_CANCELLABLE_STATUSES = ['Pending', 'Confirmed']

function OrderDetail() {
  const { id } = useParams()

  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  const [history, setHistory] = useState([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState('')

  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  const [review, setReview] = useState(null)
  const [draftRating, setDraftRating] = useState(0)
  const [draftText, setDraftText] = useState('')
  const [reviewError, setReviewError] = useState('')

  useEffect(() => {
    let isMounted = true

    async function loadOrder() {
      setIsLoading(true)
      try {
        const fetched = await getCustomerOrderById(id)
        if (!isMounted) return
        setOrder(fetched)
        setLoadError('')
        setReview(fetched ? getReviewForOrder(fetched.orderNumber) : null)
      } catch (err) {
        if (isMounted) setLoadError(err.message)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    async function loadHistory() {
      setIsLoadingHistory(true)
      try {
        const fetched = await getOrderStatusHistory(id)
        if (isMounted) {
          setHistory(fetched)
          setHistoryError('')
        }
      } catch (err) {
        if (isMounted) setHistoryError(err.message)
      } finally {
        if (isMounted) setIsLoadingHistory(false)
      }
    }

    loadOrder()
    loadHistory()
    return () => {
      isMounted = false
    }
  }, [id])

  async function handleCancel() {
    if (!window.confirm(`Cancel order ${order.orderNumber}?`)) return

    setCancelError('')
    setIsCancelling(true)
    try {
      await cancelCustomerOrder(order.id)
      const [refreshedOrder, refreshedHistory] = await Promise.all([
        getCustomerOrderById(id),
        getOrderStatusHistory(id),
      ])
      setOrder(refreshedOrder)
      setHistory(refreshedHistory)
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setIsCancelling(false)
    }
  }

  function handleSubmitReview(event) {
    event.preventDefault()
    if (draftRating === 0) {
      setReviewError('Please choose a star rating.')
      return
    }
    setReviewError('')
    setReview(submitReview(order.orderNumber, draftRating, draftText.trim()))
  }

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-exclamation-triangle-fill fs-1 text-muted d-block mb-3"></i>
        <h1>Something Went Wrong</h1>
        <p className="text-muted">{loadError}</p>
        <Link to="/orders" className="btn btn-brand">Back to My Orders</Link>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-emoji-frown fs-1 text-muted d-block mb-3"></i>
        <h1>Order Not Found</h1>
        <p className="text-muted">We couldn't find an order with that number.</p>
        <Link to="/orders" className="btn btn-brand">Back to My Orders</Link>
      </div>
    )
  }

  const currentStepIndex = ORDER_STATUS_FLOW.indexOf(order.status)
  const canCancel = CUSTOMER_CANCELLABLE_STATUSES.includes(order.status)

  return (
    <div className="container py-4 py-md-5">
      <Link to="/orders" className="d-inline-flex align-items-center gap-1 text-muted mb-4">
        <i className="bi bi-arrow-left"></i> Back to My Orders
      </Link>

      <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-4">
        <div>
          <h1 className="mb-1">{order.orderNumber}</h1>
          <div className="text-muted">Placed on {new Date(order.createdAt).toLocaleString()}</div>
        </div>
        <div className="d-flex gap-2">
          <StatusBadge status={order.status} />
          <StatusBadge status={order.paymentStatus} />
        </div>
      </div>

      {currentStepIndex >= 0 && (
        <div className="card-plain p-4 mb-4">
          <div className="d-flex justify-content-between flex-wrap gap-2">
            {ORDER_STATUS_FLOW.map((step, index) => (
              <div key={step} className="text-center flex-fill">
                <div
                  className="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
                  style={{
                    width: '32px',
                    height: '32px',
                    background: index <= currentStepIndex ? 'var(--color-primary)' : 'var(--color-border)',
                    color: '#fff',
                  }}
                >
                  {index <= currentStepIndex && <i className="bi bi-check-lg"></i>}
                </div>
                <div className={`small ${index <= currentStepIndex ? 'fw-semibold' : 'text-muted'}`}>
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card-plain p-4 mb-4">
        <h2 className="h5 mb-3">Order Timeline</h2>
        {isLoadingHistory ? (
          <div className="text-muted small">Loading timeline…</div>
        ) : historyError ? (
          <div className="alert alert-danger small mb-0">{historyError}</div>
        ) : history.length === 0 ? (
          <p className="text-muted small mb-0">No timeline events yet.</p>
        ) : (
          history.map((entry) => (
            <div key={entry.id} className="d-flex justify-content-between small text-muted mb-1">
              <span>{entry.status}</span>
              <span>{new Date(entry.createdAt).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>

      {order.status === 'Out for Delivery' && (
        <div className="mb-4">
          <DeliveryTracker order={order} />
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-plain p-4 mb-4">
            <h2 className="h5 mb-3">Products</h2>
            {order.items.map((item) => (
              <div
                className="d-flex justify-content-between align-items-center py-2 border-bottom"
                key={item.id}
              >
                <div>
                  <div className="fw-semibold">{item.productName}</div>
                  <div className="text-muted small">
                    {item.variantName} × {item.quantity}
                  </div>
                </div>
                <div className="fw-semibold">₹{item.lineTotal}</div>
              </div>
            ))}

            <div className="d-flex justify-content-between mt-3">
              <span className="text-muted">Subtotal</span>
              <span>₹{order.subtotal}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Delivery Charge</span>
              <span>{order.deliveryCharge === 0 ? 'FREE' : `₹${order.deliveryCharge}`}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Discount</span>
              <span>−₹{order.discount}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>Total</span>
              <span>₹{order.grandTotal}</span>
            </div>
          </div>

          <div className="card-plain p-4">
            <h2 className="h5 mb-3">Delivery Address</h2>
            <div>{order.customer.name}</div>
            <div className="text-muted">{order.address.line1}</div>
            {order.address.line2 && <div className="text-muted">{order.address.line2}</div>}
            {order.address.landmark && <div className="text-muted">Near {order.address.landmark}</div>}
            <div className="text-muted">
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </div>
            <div className="text-muted">Phone: {order.customer.phone}</div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card-plain p-4 mb-4">
            <h2 className="h5 mb-3">Delivery &amp; Payment</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Delivery Date</span>
              <span>{order.deliveryDate}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Delivery Slot</span>
              <span>{order.deliverySlot}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Payment Method</span>
              <span>{order.paymentMethod}</span>
            </div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="text-muted">Payment Status</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
            <p className="text-muted small mb-0">
              Demo payment only — no real payment gateway is connected in this phase.
            </p>
          </div>

          {order.status === 'Cancelled' ? (
            <div className="card-plain p-4">
              <StatusBadge status="Cancelled" />
              <p className="text-muted small mt-2 mb-0">This order has been cancelled.</p>
            </div>
          ) : canCancel && (
            <div className="card-plain p-4">
              {cancelError && <div className="alert alert-danger small">{cancelError}</div>}
              <button
                type="button"
                className="btn btn-outline-danger w-100"
                onClick={handleCancel}
                disabled={isCancelling}
              >
                {isCancelling ? 'Cancelling…' : 'Cancel Order'}
              </button>
            </div>
          )}
        </div>
      </div>

      {order.status === 'Delivered' && (
        <div className="card-plain p-4 mt-4">
          <h2 className="h5 mb-3">Rate &amp; Review</h2>

          {review ? (
            <div>
              <StarRating value={review.rating} readOnly />
              {review.reviewText && <p className="text-muted mt-2 mb-0">{review.reviewText}</p>}
              <p className="text-muted small mt-2 mb-0">
                Reviewed on {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview}>
              <div className="mb-3">
                <StarRating value={draftRating} onChange={setDraftRating} size="1.75rem" />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="reviewText">Review (optional)</label>
                <textarea
                  id="reviewText"
                  className="form-control"
                  rows="3"
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  placeholder="How was your delivery?"
                />
              </div>
              {reviewError && <div className="text-danger small mb-3">{reviewError}</div>}
              <button type="submit" className="btn btn-brand">Submit Review</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default OrderDetail
