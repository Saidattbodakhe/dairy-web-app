import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import StatusBadge from '../../components/StatusBadge'
import StarRating from '../../components/StarRating'
import DeliveryTracker from '../../components/DeliveryTracker'
import { ORDER_STATUS_FLOW, getOrderByNumber } from '../../utils/orders'
import { getReviewForOrder, submitReview } from '../../utils/reviews'

function OrderDetail() {
  const { id } = useParams()
  const order = getOrderByNumber(id)
  const [review, setReview] = useState(() => (order ? getReviewForOrder(order.orderNumber) : null))
  const [draftRating, setDraftRating] = useState(0)
  const [draftText, setDraftText] = useState('')
  const [reviewError, setReviewError] = useState('')

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

  function handleSubmitReview(event) {
    event.preventDefault()
    if (draftRating === 0) {
      setReviewError('Please choose a star rating.')
      return
    }
    setReviewError('')
    setReview(submitReview(order.orderNumber, draftRating, draftText.trim()))
  }

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

          {order.statusHistory?.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="fw-semibold small mb-2">Order Timeline</div>
              {order.statusHistory.map((entry) => (
                <div
                  key={`${entry.status}-${entry.at}`}
                  className="d-flex justify-content-between small text-muted mb-1"
                >
                  <span>{entry.status}</span>
                  <span>{new Date(entry.at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                key={`${item.productId}-${item.variantId}`}
              >
                <div>
                  <div className="fw-semibold">{item.productName}</div>
                  <div className="text-muted small">{item.variantName} × {item.quantity}</div>
                </div>
                <div className="fw-semibold">₹{item.price * item.quantity}</div>
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
          <div className="card-plain p-4">
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
