import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createSubscription, getSubscriptions, updateSubscription } from '../../utils/subscriptions'
import { getAddresses, formatAddress } from '../../utils/addresses'
import { addNotification } from '../../utils/notifications'
import { useAuth } from '../../context/AuthContext'
import { useProducts } from '../../context/ProductContext'
import StatusBadge from '../../components/StatusBadge'

const frequencies = ['Daily', 'Selected Days', 'Custom']
const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const deliverySlots = ['6:00 AM – 8:00 AM', '8:00 AM – 10:00 AM', '5:00 PM – 7:00 PM']

const benefits = [
  { icon: 'bi-droplet-fill', title: 'Daily Fresh Milk', detail: 'Delivered on your schedule, every time.' },
  { icon: 'bi-calendar2-week', title: 'Flexible Schedule', detail: 'Daily, selected days, or custom.' },
  { icon: 'bi-pause-circle', title: 'Pause Anytime', detail: 'Going away? Pause with one tap.' },
  { icon: 'bi-skip-forward-circle', title: 'Skip a Delivery', detail: "Don't need tomorrow's delivery? Skip it." },
  { icon: 'bi-check2-circle', title: 'Easy Management', detail: 'Everything in one place, no calls needed.' },
]

const initialForm = {
  productId: '',
  variantId: '',
  frequency: 'Daily',
  selectedDays: [],
  quantity: 1,
  startDate: '',
  endDate: '',
  deliverySlot: '',
  addressId: '',
}

// Presentational only — reads the same fields the subscription already
// stores (frequency/selectedDays/nextDeliverySkipped/status).
function nextDeliveryLabel(subscription) {
  if (subscription.status === 'Paused') return 'Paused'
  if (subscription.nextDeliverySkipped) return 'Skipped'
  if (subscription.frequency === 'Daily') return 'Tomorrow'
  if (subscription.frequency === 'Selected Days') {
    return subscription.selectedDays[0] || 'Next scheduled day'
  }
  return 'As scheduled'
}

// Which weekdays this subscription actually delivers on, purely derived
// from existing fields — no new schedule data invented. "Custom"
// frequency has no fixed weekly pattern to visualize, so it's skipped.
function getScheduledDays(subscription) {
  if (subscription.frequency === 'Daily') return weekDays
  if (subscription.frequency === 'Selected Days') return subscription.selectedDays
  return []
}

function formatDateLabel(isoDate) {
  if (!isoDate) return 'Not selected'
  return new Date(isoDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Subscription() {
  const { isLoggedIn, isLoading } = useAuth()
  const { products } = useProducts()
  const [subscriptions, setSubscriptions] = useState(getSubscriptions)
  const [addresses] = useState(getAddresses)
  const [form, setForm] = useState(() => {
    const firstProduct = products.find((product) => product.isActive)
    return {
      ...initialForm,
      productId: firstProduct?.id ?? '',
      variantId: firstProduct?.variants.find((variant) => variant.isActive)?.id ?? '',
      addressId: getAddresses()[0]?.id ?? '',
    }
  })
  const [error, setError] = useState('')
  const [justCreated, setJustCreated] = useState(false)

  if (isLoading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  // Subscription management is customer-account-specific, same login
  // requirement as /orders and /profile.
  if (!isLoggedIn) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-person-circle fs-1 text-muted d-block mb-3"></i>
        <h1>You're not logged in</h1>
        <p className="text-muted">Log in to create and manage your dairy subscription.</p>
        <Link to="/login" className="btn btn-brand">Login</Link>
      </div>
    )
  }

  const selectedProduct = products.find(
    (product) => product.id === form.productId && product.isActive
  )
  const activeVariants = selectedProduct
    ? selectedProduct.variants.filter((variant) => variant.isActive)
    : []
  const selectedVariant = activeVariants.find((variant) => variant.id === form.variantId)
  const selectedAddress = addresses.find((address) => address.id === form.addressId)
  const estimatedAmount = selectedVariant ? selectedVariant.price * form.quantity : null

  const activeSubscriptions = subscriptions.filter((subscription) => subscription.status === 'Active')

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setJustCreated(false)
  }

  function handleProductChange(productId) {
    const product = products.find((candidate) => candidate.id === productId)
    const firstVariant = product?.variants.find((variant) => variant.isActive)
    setForm((current) => ({ ...current, productId, variantId: firstVariant?.id ?? '' }))
    setJustCreated(false)
  }

  function toggleDay(day) {
    setForm((current) => ({
      ...current,
      selectedDays: current.selectedDays.includes(day)
        ? current.selectedDays.filter((d) => d !== day)
        : [...current.selectedDays, day],
    }))
    setJustCreated(false)
  }

  function changeQuantity(delta) {
    setForm((current) => ({ ...current, quantity: Math.max(1, current.quantity + delta) }))
    setJustCreated(false)
  }

  function handleCreate(event) {
    event.preventDefault()
    setJustCreated(false)

    if (!form.startDate) return setError('Start date is required.')
    if (!form.deliverySlot) return setError('Please choose a delivery slot.')
    if (form.frequency === 'Selected Days' && form.selectedDays.length === 0) {
      return setError('Choose at least one day.')
    }
    if (form.quantity < 1) return setError('Quantity must be at least 1.')
    if (!form.addressId) return setError('Please choose a delivery address.')

    const variant = activeVariants.find((candidate) => candidate.id === form.variantId)
    if (!selectedProduct || !variant) return setError('Please choose a product and size.')

    setError('')

    const created = createSubscription({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      variantId: variant.id,
      variantName: variant.name,
      price: variant.price,
      frequency: form.frequency,
      selectedDays: form.frequency === 'Selected Days' ? form.selectedDays : [],
      quantity: form.quantity,
      startDate: form.startDate,
      endDate: form.endDate,
      deliverySlot: form.deliverySlot,
      address: selectedAddress ? formatAddress(selectedAddress) : 'No address selected',
    })

    setSubscriptions((current) => [...current, created])
    setForm({ ...initialForm, addressId: getAddresses()[0]?.id ?? '' })
    setJustCreated(true)
  }

  // confirmMessage is only passed for actions worth a second thought
  // (pausing, skipping, cancelling) — Resume doesn't need one.
  function handleAction(id, changes, confirmMessage) {
    if (confirmMessage && !window.confirm(confirmMessage)) return

    setSubscriptions(updateSubscription(id, changes))

    if (changes.status === 'Paused') addNotification('Your subscription is paused.')
    if (changes.nextDeliverySkipped) addNotification('Your next delivery has been skipped.')
  }

  return (
    <div>
      {/* Page header */}
      <section className="pt-4 pt-md-5 pb-3">
        <div className="container text-center">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: '56px', height: '56px', background: 'var(--color-primary-light)' }}
          >
            <i className="bi bi-arrow-repeat fs-4" style={{ color: 'var(--color-primary)' }}></i>
          </div>
          <h1 className="mb-2">Fresh Milk, Delivered Your Way</h1>
          <p className="text-muted mb-0">
            Choose your product, quantity, delivery days, and time slot. We take care of the rest.
          </p>
        </div>
      </section>

      <div className="container pb-5">
        {/* Benefits */}
        <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-3 mb-5">
          {benefits.map((benefit) => (
            <div className="col" key={benefit.title}>
              <div className="card-plain p-3 h-100 text-center">
                <i
                  className={`bi ${benefit.icon} mb-2`}
                  style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}
                ></i>
                <div className="fw-semibold small">{benefit.title}</div>
                <div className="text-muted small">{benefit.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Create subscription */}
        <h2 className="h4 mb-3">Create a Subscription</h2>
        <div className="row g-4 mb-5">
          <div className="col-12 col-lg-7">
            <div className="card-plain p-4">
              {justCreated && (
                <div className="alert alert-success">
                  <i className="bi bi-check-circle-fill me-2"></i>
                  Subscription created! We'll deliver as scheduled.
                </div>
              )}

              <form onSubmit={handleCreate}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="product">Product</label>
                  <select
                    id="product"
                    className="form-select"
                    value={form.productId}
                    onChange={(e) => handleProductChange(e.target.value)}
                  >
                    {products
                      .filter((product) => product.isActive)
                      .map((product) => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label d-block">Size</label>
                  <div className="d-flex flex-wrap gap-2">
                    {activeVariants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        className={`btn btn-sm ${form.variantId === variant.id ? 'btn-brand' : 'btn-outline-secondary'}`}
                        onClick={() => updateField('variantId', variant.id)}
                      >
                        {variant.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label d-block">Frequency</label>
                  <div className="d-flex flex-wrap gap-2">
                    {frequencies.map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        className={`btn btn-sm ${form.frequency === freq ? 'btn-brand' : 'btn-outline-secondary'}`}
                        onClick={() => updateField('frequency', freq)}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

                {form.frequency === 'Selected Days' && (
                  <div className="mb-3">
                    <label className="form-label d-block">Choose Days</label>
                    <div className="d-flex flex-wrap gap-2">
                      {weekDays.map((day) => (
                        <button
                          key={day}
                          type="button"
                          className={`btn btn-sm ${form.selectedDays.includes(day) ? 'btn-brand' : 'btn-outline-secondary'}`}
                          onClick={() => toggleDay(day)}
                        >
                          {day.slice(0, 3)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label d-block">Quantity</label>
                  <div className="d-inline-flex align-items-center border rounded-3">
                    <button
                      type="button"
                      className="btn btn-lg"
                      aria-label="Decrease quantity"
                      onClick={() => changeQuantity(-1)}
                      disabled={form.quantity <= 1}
                    >
                      −
                    </button>
                    <span className="px-4 fw-semibold">{form.quantity}</span>
                    <button
                      type="button"
                      className="btn btn-lg"
                      aria-label="Increase quantity"
                      onClick={() => changeQuantity(1)}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label d-block">Delivery Slot</label>
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
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label" htmlFor="startDate">Start Date</label>
                    <input
                      id="startDate"
                      type="date"
                      className="form-control"
                      value={form.startDate}
                      onChange={(e) => updateField('startDate', e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label" htmlFor="endDate">End Date (optional)</label>
                    <input
                      id="endDate"
                      type="date"
                      className="form-control"
                      value={form.endDate}
                      onChange={(e) => updateField('endDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label d-block">Delivery Address</label>
                  {addresses.length === 0 ? (
                    <div className="text-muted small">
                      No saved addresses yet. <Link to="/profile">Add one in your Profile</Link>.
                    </div>
                  ) : (
                    <>
                      {selectedAddress && (
                        <div className="border rounded-3 p-3 mb-2">
                          <div className="fw-semibold mb-1">
                            <i className="bi bi-house-door-fill me-1"></i> {selectedAddress.label}
                          </div>
                          <div className="text-muted small">
                            {selectedAddress.line1}
                            {selectedAddress.line2 ? `, ${selectedAddress.line2}` : ''}
                            {selectedAddress.landmark ? `, Near ${selectedAddress.landmark}` : ''},{' '}
                            {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
                          </div>
                        </div>
                      )}
                      {addresses.length > 1 && (
                        <select
                          id="subAddress"
                          className="form-select form-select-sm"
                          aria-label="Change delivery address"
                          value={form.addressId}
                          onChange={(e) => updateField('addressId', e.target.value)}
                        >
                          {addresses.map((address) => (
                            <option key={address.id} value={address.id}>{formatAddress(address)}</option>
                          ))}
                        </select>
                      )}
                    </>
                  )}
                </div>

                {error && <div className="text-danger small mb-3">{error}</div>}

                <button type="submit" className="btn btn-accent btn-lg w-100">Start Subscription</button>
              </form>
            </div>
          </div>

          {/* Live summary */}
          <div className="col-12 col-lg-5">
            <div className="card-plain p-4">
              <div className="text-uppercase small text-muted mb-2">Your Subscription</div>
              <div className="fw-bold fs-5 mb-1">{selectedProduct?.name ?? 'Choose a product'}</div>
              <div className="text-muted small mb-3">
                {selectedVariant ? `${form.quantity} × ${selectedVariant.name}` : 'Choose a size'}
                {' '}&middot; {form.frequency}
                {form.frequency === 'Selected Days' && form.selectedDays.length > 0 && (
                  <> ({form.selectedDays.map((day) => day.slice(0, 3)).join(', ')})</>
                )}
              </div>

              <div className="d-flex justify-content-between small mb-2">
                <span className="text-muted">Delivery</span>
                <span>{form.deliverySlot || 'Not selected'}</span>
              </div>
              <div className="d-flex justify-content-between small mb-3">
                <span className="text-muted">Starting</span>
                <span>{formatDateLabel(form.startDate)}</span>
              </div>

              <hr />

              <div className="d-flex justify-content-between align-items-baseline">
                <span className="fw-semibold">Estimated Amount</span>
                <span className="fs-4 fw-bold" style={{ color: 'var(--color-primary-dark)' }}>
                  {estimatedAmount !== null ? `₹${estimatedAmount}` : '—'}
                </span>
              </div>
              <div className="text-muted small text-end">per delivery</div>
            </div>
          </div>
        </div>

        {/* Your subscriptions */}
        <h2 className="h4 mb-3">Your Subscriptions</h2>
        {subscriptions.length === 0 ? (
          <div className="card-plain p-5 text-center mb-5">
            <i className="bi bi-arrow-repeat fs-1 text-muted d-block mb-3"></i>
            <p className="text-muted mb-0">You don't have any subscriptions yet. Create one above.</p>
          </div>
        ) : (
          <div className="row g-3 mb-5">
            {subscriptions.map((subscription) => (
              <div className="col-12 col-lg-6" key={subscription.id}>
                <div className="card-plain p-4 h-100">
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
                    <div>
                      <div className="fw-bold fs-5">{subscription.productName}</div>
                      <div className="text-muted small">
                        {subscription.quantity} &times; {subscription.variantName} &middot; {subscription.frequency}
                        {subscription.frequency === 'Selected Days' && subscription.selectedDays.length > 0 && (
                          <> ({subscription.selectedDays.map((day) => day.slice(0, 3)).join(', ')})</>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={subscription.status} />
                  </div>

                  <div className="p-3 rounded-3 mb-3" style={{ background: 'var(--color-primary-light)' }}>
                    <div className="text-uppercase small text-muted mb-1">Next Delivery</div>
                    <div className="fw-semibold">{nextDeliveryLabel(subscription)}</div>
                    {subscription.status !== 'Paused' && (
                      <div className="text-muted small">{subscription.deliverySlot}</div>
                    )}
                  </div>

                  <div className="text-muted small mb-3">
                    Starts {subscription.startDate}
                    {subscription.endDate ? ` – Ends ${subscription.endDate}` : ''}
                    {subscription.address ? ` · ${subscription.address}` : ''}
                  </div>

                  <div className="d-flex flex-wrap gap-2">
                    {subscription.status === 'Active' && (
                      <>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            handleAction(
                              subscription.id,
                              { status: 'Paused' },
                              'Pause this subscription? You can resume it anytime.'
                            )
                          }
                        >
                          Pause
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() =>
                            handleAction(
                              subscription.id,
                              { nextDeliverySkipped: true },
                              'Skip the next delivery for this subscription?'
                            )
                          }
                        >
                          Skip Next Delivery
                        </button>
                      </>
                    )}
                    {subscription.status === 'Paused' && (
                      <button
                        type="button"
                        className="btn btn-brand btn-sm"
                        onClick={() => handleAction(subscription.id, { status: 'Active' })}
                      >
                        Resume Subscription
                      </button>
                    )}
                    {subscription.status !== 'Cancelled' && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() =>
                          handleAction(
                            subscription.id,
                            { status: 'Cancelled' },
                            'Cancel this subscription? Your future scheduled deliveries will be cancelled. This can\'t be undone (demo).'
                          )
                        }
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delivery schedule */}
        {activeSubscriptions.length > 0 && (
          <>
            <h2 className="h4 mb-3">Delivery Schedule</h2>
            <div className="d-flex flex-column gap-3 mb-5">
              {activeSubscriptions.map((subscription) => {
                const scheduledDays = getScheduledDays(subscription)
                return (
                  <div className="card-plain p-4" key={subscription.id}>
                    <div className="fw-semibold mb-3">
                      {subscription.productName} — {subscription.variantName}
                    </div>
                    {scheduledDays.length === 0 ? (
                      <p className="text-muted small mb-0">
                        Custom schedule — see the subscription card above for details.
                      </p>
                    ) : (
                      <div className="d-flex flex-wrap gap-2">
                        {weekDays.map((day) => {
                          const isScheduled = scheduledDays.includes(day)
                          return (
                            <div
                              key={day}
                              className="text-center rounded-3 p-2"
                              style={{
                                minWidth: '86px',
                                background: isScheduled ? 'var(--color-primary-light)' : 'var(--color-bg-soft)',
                                border: `1px solid ${isScheduled ? 'var(--color-primary)' : 'var(--color-border)'}`,
                              }}
                            >
                              <div
                                className="small fw-bold text-uppercase"
                                style={{ color: isScheduled ? 'var(--color-primary-dark)' : 'var(--color-text-muted)' }}
                              >
                                {day.slice(0, 3)}
                              </div>
                              {isScheduled ? (
                                <div className="small text-muted mt-1">{subscription.deliverySlot}</div>
                              ) : (
                                <div className="small text-muted mt-1">—</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Helpful information */}
        <div className="card-plain p-4">
          <h2 className="h6 mb-3">Good to Know</h2>
          <ul className="text-muted small mb-0 ps-3">
            <li className="mb-2">You can pause or skip a delivery anytime — no penalties.</li>
            <li className="mb-2">Cancelling stops all future scheduled deliveries immediately.</li>
            <li>This is a demo experience — no real payment is charged.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Subscription
