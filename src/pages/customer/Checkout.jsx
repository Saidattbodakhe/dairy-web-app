import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useProducts } from '../../context/ProductContext'
import { useServiceLocation } from '../../context/LocationContext'
import { calculateDeliveryCharge } from '../../utils/orderTotals'
import { createOrder } from '../../utils/orders'
import { getAddresses } from '../../utils/addresses'
import { resolveCartLines } from '../../utils/cartPricing'

const deliverySlots = ['6:00 AM – 8:00 AM', '8:00 AM – 10:00 AM', '5:00 PM – 7:00 PM']
const paymentMethods = ['Online Payment', 'Cash on Delivery']

const initialForm = {
  name: '',
  phone: '',
  email: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  deliveryDate: '',
  deliverySlot: '',
  paymentMethod: '',
}

function validate(form) {
  const errors = {}

  if (!form.name.trim()) errors.name = 'Name is required.'
  if (!/^\d{10}$/.test(form.phone.trim())) errors.phone = 'Enter a valid 10-digit phone number.'
  if (!form.addressLine1.trim()) errors.addressLine1 = 'Address is required.'
  if (!form.city.trim()) errors.city = 'City is required.'
  if (!form.state.trim()) errors.state = 'State is required.'
  if (!/^\d{6}$/.test(form.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.'
  if (!form.deliveryDate) errors.deliveryDate = 'Delivery date is required.'
  if (!form.deliverySlot) errors.deliverySlot = 'Please choose a delivery slot.'
  if (!form.paymentMethod) errors.paymentMethod = 'Please choose a payment method.'

  return errors
}

function Checkout() {
  const { items, clearCart } = useCart()
  const { getProductById } = useProducts()
  const { isOutsideServiceArea } = useServiceLocation()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [placedOrder, setPlacedOrder] = useState(null)
  const [addresses] = useState(getAddresses)

  const resolvedLines = resolveCartLines(items, getProductById)
  const hasUnavailableItems = resolvedLines.some((line) => !line.isAvailable)
  // Live prices at checkout time — once createOrder() runs below, the
  // resulting order keeps its own price snapshot forever, so this is
  // only ever "what would the customer pay right now."
  const subtotal = resolvedLines
    .filter((line) => line.isAvailable)
    .reduce((total, line) => total + line.currentPrice * line.item.quantity, 0)

  const todayIso = new Date().toISOString().split('T')[0]
  const deliveryCharge = calculateDeliveryCharge(subtotal)
  const discount = 0
  const grandTotal = subtotal + deliveryCharge - discount
  const canPlaceOrder = !isOutsideServiceArea && !hasUnavailableItems

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function applySavedAddress(address) {
    setForm((current) => ({
      ...current,
      addressLine1: address.line1,
      addressLine2: address.line2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!canPlaceOrder) return

    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    const order = createOrder({
      customer: { name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() },
      address: {
        line1: form.addressLine1.trim(),
        line2: form.addressLine2.trim(),
        landmark: form.landmark.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      },
      // Snapshotted at order-creation time using the live price above —
      // this order object is what preserves historical pricing from now on.
      items: resolvedLines.map(({ item, currentPrice }) => ({
        ...item,
        price: currentPrice,
        lineTotal: currentPrice * item.quantity,
      })),
      subtotal,
      deliveryCharge,
      discount,
      grandTotal,
      deliveryDate: form.deliveryDate,
      deliverySlot: form.deliverySlot,
      paymentMethod: form.paymentMethod,
    })

    clearCart()
    setPlacedOrder(order)
  }

  // Order confirmation — shown after a successful demo Place Order,
  // regardless of the cart being empty now.
  if (placedOrder) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-check-circle-fill fs-1 text-success d-block mb-3"></i>
        <h1>Order Placed!</h1>
        <p className="text-muted">Thank you, {placedOrder.customer.name}. Your order number is:</p>
        <div className="fs-4 fw-bold mb-4">{placedOrder.orderNumber}</div>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Link to={`/orders/${placedOrder.orderNumber}`} className="btn btn-brand">
            View Order
          </Link>
          <Link to="/products" className="btn btn-outline-secondary">
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x fs-1 text-muted d-block mb-3"></i>
        <h1>Your cart is empty</h1>
        <p className="text-muted">Add some products before checking out.</p>
        <Link to="/products" className="btn btn-brand">Browse Products</Link>
      </div>
    )
  }

  // The cart is NEVER cleared for either of these cases — the customer
  // can go back, fix the location or remove the unavailable item, and
  // come straight back to checkout with everything still there.
  if (isOutsideServiceArea) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-geo-alt-fill fs-1 text-muted d-block mb-3"></i>
        <h1>Delivery Unavailable</h1>
        <p className="text-muted">Delivery is currently unavailable in your location.</p>
        <Link to="/cart" className="btn btn-brand">Back to Cart</Link>
      </div>
    )
  }

  if (hasUnavailableItems) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-exclamation-triangle-fill fs-1 text-muted d-block mb-3"></i>
        <h1>Some Items Are No Longer Available</h1>
        <p className="text-muted">
          Remove the unavailable items from your cart before placing this order.
        </p>
        <Link to="/cart" className="btn btn-brand">Back to Cart</Link>
      </div>
    )
  }

  return (
    <div className="container py-4 py-md-5">
      <h1 className="mb-4">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <div className="card-plain p-4 mb-4">
              <h2 className="h5 mb-3">Delivery Details</h2>

              {addresses.length > 0 && (
                <div className="mb-3">
                  <div className="fw-semibold small mb-2">Use a saved address</div>
                  <div className="d-flex flex-wrap gap-2">
                    {addresses.map((address) => (
                      <button
                        key={address.id}
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => applySavedAddress(address)}
                      >
                        <i className="bi bi-geo-alt me-1"></i>
                        {address.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="name">Customer Name</label>
                  <input
                    id="name"
                    type="text"
                    className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="phone">Phone Number</label>
                  <input
                    id="phone"
                    type="tel"
                    className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="email">Email (optional)</label>
                  <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="addressLine1">Address Line 1</label>
                  <input
                    id="addressLine1"
                    type="text"
                    className={`form-control ${errors.addressLine1 ? 'is-invalid' : ''}`}
                    value={form.addressLine1}
                    onChange={(e) => updateField('addressLine1', e.target.value)}
                  />
                  {errors.addressLine1 && <div className="invalid-feedback">{errors.addressLine1}</div>}
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="addressLine2">Address Line 2 (optional)</label>
                  <input
                    id="addressLine2"
                    type="text"
                    className="form-control"
                    value={form.addressLine2}
                    onChange={(e) => updateField('addressLine2', e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label" htmlFor="landmark">Landmark (optional)</label>
                  <input
                    id="landmark"
                    type="text"
                    className="form-control"
                    value={form.landmark}
                    onChange={(e) => updateField('landmark', e.target.value)}
                  />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="city">City</label>
                  <input
                    id="city"
                    type="text"
                    className={`form-control ${errors.city ? 'is-invalid' : ''}`}
                    value={form.city}
                    onChange={(e) => updateField('city', e.target.value)}
                  />
                  {errors.city && <div className="invalid-feedback">{errors.city}</div>}
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="state">State</label>
                  <input
                    id="state"
                    type="text"
                    className={`form-control ${errors.state ? 'is-invalid' : ''}`}
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value)}
                  />
                  {errors.state && <div className="invalid-feedback">{errors.state}</div>}
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label" htmlFor="pincode">Pincode</label>
                  <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    className={`form-control ${errors.pincode ? 'is-invalid' : ''}`}
                    value={form.pincode}
                    onChange={(e) => updateField('pincode', e.target.value)}
                  />
                  {errors.pincode && <div className="invalid-feedback">{errors.pincode}</div>}
                </div>
              </div>
            </div>

            <div className="card-plain p-4 mb-4">
              <h2 className="h5 mb-3">Delivery Date &amp; Slot</h2>

              <div className="mb-3">
                <label className="form-label" htmlFor="deliveryDate">Delivery Date</label>
                <input
                  id="deliveryDate"
                  type="date"
                  min={todayIso}
                  className={`form-control ${errors.deliveryDate ? 'is-invalid' : ''}`}
                  style={{ maxWidth: '260px' }}
                  value={form.deliveryDate}
                  onChange={(e) => updateField('deliveryDate', e.target.value)}
                />
                {errors.deliveryDate && <div className="invalid-feedback">{errors.deliveryDate}</div>}
              </div>

              <div className="fw-semibold mb-2">Delivery Slot</div>
              <div className="d-flex flex-wrap gap-2">
                {deliverySlots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`btn btn-sm ${form.deliverySlot === slot ? 'btn-brand' : 'btn-outline-secondary'}`}
                    onClick={() => updateField('deliverySlot', slot)}
                  >
                    {slot}
                  </button>
                ))}
              </div>
              {errors.deliverySlot && <div className="text-danger small mt-2">{errors.deliverySlot}</div>}
            </div>

            <div className="card-plain p-4">
              <h2 className="h5 mb-3">Payment Method</h2>
              <div className="d-flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method}
                    type="button"
                    className={`btn btn-sm ${form.paymentMethod === method ? 'btn-brand' : 'btn-outline-secondary'}`}
                    onClick={() => updateField('paymentMethod', method)}
                  >
                    {method}
                  </button>
                ))}
              </div>
              {errors.paymentMethod && <div className="text-danger small mt-2">{errors.paymentMethod}</div>}
              <p className="text-muted small mt-3 mb-0">
                Demo phase only — no real payment gateway is connected yet.
              </p>
            </div>
          </div>

          <div className="col-12 col-lg-4">
            <div className="card-plain p-4">
              <h2 className="h5 mb-3">Order Summary</h2>

              {resolvedLines.map(({ item, currentPrice }) => (
                <div
                  className="d-flex justify-content-between small mb-2"
                  key={`${item.productId}-${item.variantId}`}
                >
                  <span className="text-muted">
                    {item.productName} ({item.variantName}) × {item.quantity}
                  </span>
                  <span>₹{currentPrice * item.quantity}</span>
                </div>
              ))}

              <hr />

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Delivery</span>
                <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted">Discount</span>
                <span>−₹{discount}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>

              <button type="submit" className="btn btn-accent btn-lg w-100" disabled={!canPlaceOrder}>
                Place Order
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Checkout
