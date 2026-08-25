import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useProducts } from '../../context/ProductContext'
import { useServiceLocation } from '../../context/LocationContext'
import { calculateDeliveryCharge } from '../../utils/orderTotals'
import { createOrder } from '../../services/orderService'
import { getCustomerAddresses, createCustomerAddress } from '../../services/addressService'
import { resolveCartLines } from '../../utils/cartPricing'

const deliverySlots = ['6:00 AM – 8:00 AM', '8:00 AM – 10:00 AM', '5:00 PM – 7:00 PM']
const paymentMethods = ['Online Payment', 'Cash on Delivery']

const initialForm = {
  deliveryDate: '',
  deliverySlot: '',
  paymentMethod: '',
}

const initialAddressForm = {
  label: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
}

function validate(form, selectedAddressId) {
  const errors = {}

  if (!selectedAddressId) errors.address = 'Please select or add a delivery address.'
  if (!form.deliveryDate) errors.deliveryDate = 'Delivery date is required.'
  if (!form.deliverySlot) errors.deliverySlot = 'Please choose a delivery slot.'
  if (!form.paymentMethod) errors.paymentMethod = 'Please choose a payment method.'

  return errors
}

function validateAddressForm(addressForm) {
  const errors = {}

  if (!addressForm.label.trim()) errors.label = 'Give this address a label (e.g. Home).'
  if (!addressForm.line1.trim()) errors.line1 = 'Address line 1 is required.'
  if (!addressForm.city.trim()) errors.city = 'City is required.'
  if (!addressForm.state.trim()) errors.state = 'State is required.'
  if (!/^\d{6}$/.test(addressForm.pincode.trim())) errors.pincode = 'Enter a valid 6-digit pincode.'
  if (!/^\d{10}$/.test(addressForm.phone.trim())) errors.phone = 'Enter a valid 10-digit phone number.'

  return errors
}

function formatAddressSummary(address) {
  const parts = [
    address.line1,
    address.line2,
    address.landmark ? `Near ${address.landmark}` : '',
    `${address.city}, ${address.state} - ${address.pincode}`,
  ].filter(Boolean)

  return parts.join(', ')
}

function Checkout() {
  const { isLoggedIn, isLoading: isAuthLoading } = useAuth()
  const { items, clearCart } = useCart()
  const { getProductById } = useProducts()
  const { isOutsideServiceArea } = useServiceLocation()

  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [placedOrder, setPlacedOrder] = useState(null)
  const [orderError, setOrderError] = useState('')
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  const [addresses, setAddresses] = useState([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const [addressLoadError, setAddressLoadError] = useState('')
  const [selectedAddressId, setSelectedAddressId] = useState('')

  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState(initialAddressForm)
  const [addressFormErrors, setAddressFormErrors] = useState({})
  const [isSavingAddress, setIsSavingAddress] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) return

    let isMounted = true
    async function loadAddresses() {
      setIsLoadingAddresses(true)
      try {
        const fetched = await getCustomerAddresses()
        if (!isMounted) return
        setAddresses(fetched)
        setAddressLoadError('')
        const defaultAddress = fetched.find((address) => address.isDefault) ?? fetched[0]
        if (defaultAddress) setSelectedAddressId(defaultAddress.id)
        if (fetched.length === 0) setShowNewAddressForm(true)
      } catch (err) {
        if (isMounted) setAddressLoadError(err.message)
      } finally {
        if (isMounted) setIsLoadingAddresses(false)
      }
    }

    loadAddresses()
    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  const resolvedLines = resolveCartLines(items, getProductById)
  const hasUnavailableItems = resolvedLines.some((line) => !line.isAvailable)
  // Live prices at checkout time — create_order() recomputes and
  // snapshots the authoritative price/total server-side, so this is
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

  function updateAddressField(field, value) {
    setAddressForm((current) => ({ ...current, [field]: value }))
  }

  async function handleAddAddress(event) {
    event.preventDefault()

    const validationErrors = validateAddressForm(addressForm)
    setAddressFormErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSavingAddress(true)
    try {
      const created = await createCustomerAddress(addressForm)
      setAddresses((current) => [...current, created])
      setSelectedAddressId(created.id)
      setAddressForm(initialAddressForm)
      setAddressFormErrors({})
      setShowNewAddressForm(false)
    } catch (err) {
      setAddressFormErrors({ form: err.message })
    } finally {
      setIsSavingAddress(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!canPlaceOrder) return

    const validationErrors = validate(form, selectedAddressId)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setOrderError('')
    setIsPlacingOrder(true)
    try {
      const result = await createOrder({
        items: resolvedLines
          .filter((line) => line.isAvailable)
          .map(({ item }) => ({ variantId: item.variantId, quantity: item.quantity })),
        addressId: selectedAddressId,
        deliveryDate: form.deliveryDate,
        deliverySlot: form.deliverySlot,
        paymentMethod: form.paymentMethod,
      })

      clearCart()
      setPlacedOrder(result)
    } catch (err) {
      setOrderError(err.message)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-person-circle fs-1 text-muted d-block mb-3"></i>
        <h1>You're not logged in</h1>
        <p className="text-muted">Log in to check out and place your order.</p>
        <Link to="/login" className="btn btn-brand">Login</Link>
      </div>
    )
  }

  // Order confirmation — shown after a successful Place Order, regardless
  // of the cart being empty now.
  if (placedOrder) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-check-circle-fill fs-1 text-success d-block mb-3"></i>
        <h1>Order Placed!</h1>
        <p className="text-muted">Thank you. Your order number is:</p>
        <div className="fs-4 fw-bold mb-4">{placedOrder.orderNumber}</div>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          <Link to={`/orders/${placedOrder.id}`} className="btn btn-brand">
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
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h2 className="h5 mb-0">Delivery Address</h2>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setShowNewAddressForm((current) => !current)}
                >
                  {showNewAddressForm ? 'Cancel' : 'Add New Address'}
                </button>
              </div>

              {isLoadingAddresses && (
                <div className="text-muted small mb-3">Loading your saved addresses…</div>
              )}
              {addressLoadError && (
                <div className="alert alert-danger small mb-3">{addressLoadError}</div>
              )}

              {!isLoadingAddresses && addresses.length > 0 && (
                <div className="d-flex flex-column gap-2 mb-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className="border rounded-3 p-3 d-flex gap-2 align-items-start"
                      style={{
                        cursor: 'pointer',
                        borderColor: selectedAddressId === address.id ? 'var(--color-primary)' : undefined,
                      }}
                    >
                      <input
                        type="radio"
                        name="selectedAddress"
                        className="form-check-input mt-1"
                        checked={selectedAddressId === address.id}
                        onChange={() => setSelectedAddressId(address.id)}
                      />
                      <div>
                        <div className="fw-semibold mb-1">
                          <i className="bi bi-geo-alt me-1"></i>
                          {address.label}
                          {address.isDefault && <span className="badge text-bg-secondary ms-2">Default</span>}
                        </div>
                        <div className="text-muted small">{formatAddressSummary(address)}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {errors.address && <div className="text-danger small mb-3">{errors.address}</div>}

              {showNewAddressForm && (
                <div className="border-top pt-3">
                  <div className="row g-2 mb-2">
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className={`form-control form-control-sm ${addressFormErrors.label ? 'is-invalid' : ''}`}
                        placeholder="Label (e.g. Home)"
                        value={addressForm.label}
                        onChange={(e) => updateAddressField('label', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className={`form-control form-control-sm ${addressFormErrors.line1 ? 'is-invalid' : ''}`}
                        placeholder="Address line 1"
                        value={addressForm.line1}
                        onChange={(e) => updateAddressField('line1', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Address line 2 (optional)"
                        value={addressForm.line2}
                        onChange={(e) => updateAddressField('line2', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Landmark (optional)"
                        value={addressForm.landmark}
                        onChange={(e) => updateAddressField('landmark', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className={`form-control form-control-sm ${addressFormErrors.city ? 'is-invalid' : ''}`}
                        placeholder="City"
                        value={addressForm.city}
                        onChange={(e) => updateAddressField('city', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        className={`form-control form-control-sm ${addressFormErrors.state ? 'is-invalid' : ''}`}
                        placeholder="State"
                        value={addressForm.state}
                        onChange={(e) => updateAddressField('state', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="row g-2 mb-2">
                    <div className="col-12 col-sm-6">
                      <input
                        type="text"
                        inputMode="numeric"
                        className={`form-control form-control-sm ${addressFormErrors.pincode ? 'is-invalid' : ''}`}
                        placeholder="Pincode"
                        value={addressForm.pincode}
                        onChange={(e) => updateAddressField('pincode', e.target.value)}
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${addressFormErrors.phone ? 'is-invalid' : ''}`}
                        placeholder="Phone number"
                        value={addressForm.phone}
                        onChange={(e) => updateAddressField('phone', e.target.value)}
                      />
                    </div>
                  </div>
                  {addressFormErrors.form && (
                    <div className="text-danger small mb-2">{addressFormErrors.form}</div>
                  )}
                  <button
                    type="button"
                    className="btn btn-brand btn-sm w-100"
                    onClick={handleAddAddress}
                    disabled={isSavingAddress}
                  >
                    {isSavingAddress ? 'Saving…' : 'Save Address'}
                  </button>
                </div>
              )}
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

              {orderError && <div className="alert alert-danger small">{orderError}</div>}

              <button
                type="submit"
                className="btn btn-accent btn-lg w-100"
                disabled={!canPlaceOrder || isPlacingOrder || isLoadingAddresses}
              >
                {isLoadingAddresses ? 'Loading Addresses…' : isPlacingOrder ? 'Placing Order…' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default Checkout
