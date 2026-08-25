import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getOrders } from '../../utils/orders'
import {
  getCustomerAddresses,
  createCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
  setDefaultCustomerAddress,
} from '../../services/addressService'
import { getLoyaltySummary } from '../../utils/loyalty'
import { getSubscriptions } from '../../utils/subscriptions'
import StatusBadge from '../../components/StatusBadge'

const initialAddressForm = {
  label: '',
  line1: '',
  line2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

// Same small presentational derivation Subscription.jsx uses — kept
// local here since it's a few lines, not worth sharing across pages.
function nextDeliveryLabel(subscription) {
  if (subscription.status === 'Paused') return 'Paused'
  if (subscription.nextDeliverySkipped) return 'Skipped'
  if (subscription.frequency === 'Daily') return 'Tomorrow'
  if (subscription.frequency === 'Selected Days') {
    return subscription.selectedDays[0] || 'Next scheduled day'
  }
  return 'As scheduled'
}

function Profile() {
  const { customer, isLoggedIn, isLoading, logout } = useAuth()
  const navigate = useNavigate()

  // Demo-only notification toggles — not persisted, just for the UI.
  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    deliveryReminders: true,
    offers: false,
  })

  const [addresses, setAddresses] = useState([])
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true)
  const [addressesLoadError, setAddressesLoadError] = useState('')
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressForm, setAddressForm] = useState(initialAddressForm)
  const [addressError, setAddressError] = useState('')
  const [isSavingAddress, setIsSavingAddress] = useState(false)
  const [addressActionError, setAddressActionError] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadAddresses() {
      setIsLoadingAddresses(true)
      try {
        const fetched = await getCustomerAddresses()
        if (isMounted) {
          setAddresses(fetched)
          setAddressesLoadError('')
        }
      } catch (err) {
        if (isMounted) setAddressesLoadError(err.message)
      } finally {
        if (isMounted) setIsLoadingAddresses(false)
      }
    }
    loadAddresses()
    return () => {
      isMounted = false
    }
  }, [])

  function toggleNotification(key) {
    setNotifications((current) => ({ ...current, [key]: !current[key] }))
  }

  function updateAddressField(field, value) {
    setAddressForm((current) => ({ ...current, [field]: value }))
  }

  function handleStartAddAddress() {
    setEditingAddressId(null)
    setAddressForm(initialAddressForm)
    setAddressError('')
    setShowAddressForm((current) => !current)
  }

  function handleStartEditAddress(address) {
    setEditingAddressId(address.id)
    setAddressForm({
      label: address.label,
      line1: address.line1,
      line2: address.line2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
    })
    setAddressError('')
    setShowAddressForm(true)
  }

  async function handleSaveAddress(event) {
    event.preventDefault()

    if (!addressForm.label.trim()) return setAddressError('Give this address a label (e.g. Home).')
    if (!addressForm.line1.trim()) return setAddressError('Address line 1 is required.')
    if (!addressForm.city.trim()) return setAddressError('City is required.')
    if (!addressForm.state.trim()) return setAddressError('State is required.')
    if (!/^\d{6}$/.test(addressForm.pincode.trim())) return setAddressError('Enter a valid 6-digit pincode.')

    setAddressError('')
    setIsSavingAddress(true)
    try {
      if (editingAddressId) {
        const updated = await updateCustomerAddress(editingAddressId, addressForm)
        setAddresses((current) => current.map((address) => (address.id === updated.id ? updated : address)))
      } else {
        const created = await createCustomerAddress(addressForm)
        setAddresses((current) => [...current, created])
      }
      setAddressForm(initialAddressForm)
      setEditingAddressId(null)
      setShowAddressForm(false)
    } catch (err) {
      setAddressError(err.message)
    } finally {
      setIsSavingAddress(false)
    }
  }

  async function handleRemoveAddress(addressId) {
    if (!window.confirm('Remove this saved address?')) return

    setAddressActionError('')
    try {
      await deleteCustomerAddress(addressId)
      setAddresses((current) => current.filter((address) => address.id !== addressId))
    } catch (err) {
      setAddressActionError(err.message)
    }
  }

  async function handleSetDefaultAddress(addressId) {
    setAddressActionError('')
    try {
      await setDefaultCustomerAddress(addressId)
      const refreshed = await getCustomerAddresses()
      setAddresses(refreshed)
    } catch (err) {
      setAddressActionError(err.message)
    }
  }

  function handleLogout() {
    logout()
    navigate('/')
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

  if (!isLoggedIn) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-person-circle fs-1 text-muted d-block mb-3"></i>
        <h1>You're not logged in</h1>
        <p className="text-muted">Log in to see your profile, addresses, and orders.</p>
        <Link to="/login" className="btn btn-brand">Login</Link>
      </div>
    )
  }

  const orders = getOrders()
  const totalSpend = orders.reduce((total, order) => total + order.grandTotal, 0)
  const completedOrders = orders.filter((order) => order.status === 'Delivered').length
  const pendingOrders = orders.filter(
    (order) => !['Delivered', 'Cancelled', 'Failed'].includes(order.status)
  ).length
  const loyalty = getLoyaltySummary()
  const activeSubscriptions = getSubscriptions().filter((sub) => sub.status === 'Active')
  const primarySubscription = activeSubscriptions[0] ?? null

  return (
    <div className="container py-4 py-md-5">
      {/* Profile header */}
      <div className="card-plain p-4 mb-4 d-flex flex-column flex-sm-row align-items-center align-items-sm-start gap-3 text-center text-sm-start">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 fw-bold"
          style={{
            width: '72px',
            height: '72px',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: '1.5rem',
          }}
        >
          {getInitials(customer.name)}
        </div>
        <div>
          <div className="fs-4 fw-bold">{customer.name}</div>
          <span className="badge text-bg-secondary mb-2">Customer</span>
          <div className="text-muted">Phone: {customer.phone || 'Not provided'}</div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 mb-4">
            <h2 className="h5 mb-3">Personal Information</h2>
            <div className="mb-2"><span className="text-muted">Name:</span> {customer.name}</div>
            <div className="mb-2"><span className="text-muted">Phone:</span> {customer.phone || 'Not provided'}</div>
            <div><span className="text-muted">Email:</span> {customer.email || 'Not provided'}</div>
          </div>

          <div className="card-plain p-4 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h5 mb-0">Saved Addresses</h2>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleStartAddAddress}
              >
                {showAddressForm ? 'Cancel' : 'Add Address'}
              </button>
            </div>

            {addressActionError && <div className="text-danger small mb-2">{addressActionError}</div>}

            {isLoadingAddresses ? (
              <p className="text-muted small mb-3">Loading your saved addresses…</p>
            ) : addressesLoadError ? (
              <div className="alert alert-danger small mb-3">{addressesLoadError}</div>
            ) : (
              <div className="d-flex flex-column gap-2 mb-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    className="border rounded-3 p-3 d-flex justify-content-between align-items-start gap-2"
                  >
                    <div>
                      <div className="fw-semibold mb-1">
                        <i className="bi bi-house-door-fill me-1"></i> {address.label}
                        {address.isDefault && <span className="badge text-bg-secondary ms-2">Default</span>}
                      </div>
                      <div className="text-muted small">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ''}
                        {address.landmark ? `, Near ${address.landmark}` : ''}, {address.city},{' '}
                        {address.state} - {address.pincode}
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0"
                          onClick={() => handleStartEditAddress(address)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-link text-danger btn-sm p-0"
                          onClick={() => handleRemoveAddress(address.id)}
                        >
                          Remove
                        </button>
                      </div>
                      {!address.isDefault && (
                        <button
                          type="button"
                          className="btn btn-link btn-sm p-0"
                          onClick={() => handleSetDefaultAddress(address.id)}
                        >
                          Set as Default
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {addresses.length === 0 && (
                  <p className="text-muted small mb-0">No saved addresses yet.</p>
                )}
              </div>
            )}

            {showAddressForm && (
              <form onSubmit={handleSaveAddress} className="border-top pt-3">
                <div className="row g-2 mb-2">
                  <div className="col-12 col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="Label (e.g. Home)"
                      value={addressForm.label}
                      onChange={(e) => updateAddressField('label', e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
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
                      placeholder="Landmark (optional)"
                      value={addressForm.landmark}
                      onChange={(e) => updateAddressField('landmark', e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="City"
                      value={addressForm.city}
                      onChange={(e) => updateAddressField('city', e.target.value)}
                    />
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-12 col-sm-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder="State"
                      value={addressForm.state}
                      onChange={(e) => updateAddressField('state', e.target.value)}
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-control form-control-sm"
                      placeholder="Pincode"
                      value={addressForm.pincode}
                      onChange={(e) => updateAddressField('pincode', e.target.value)}
                    />
                  </div>
                </div>
                {addressError && <div className="text-danger small mb-2">{addressError}</div>}
                <button type="submit" className="btn btn-brand btn-sm w-100" disabled={isSavingAddress}>
                  {isSavingAddress ? 'Saving…' : editingAddressId ? 'Update Address' : 'Save Address'}
                </button>
              </form>
            )}
          </div>

          <div className="card-plain p-4">
            <h2 className="h5 mb-3">Preferences</h2>
            {[
              { key: 'orderUpdates', label: 'Order Updates' },
              { key: 'deliveryReminders', label: 'Delivery Reminders' },
              { key: 'offers', label: 'Offers & Promotions' },
            ].map((setting) => (
              <div className="form-check form-switch mb-2" key={setting.key}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  id={setting.key}
                  checked={notifications[setting.key]}
                  onChange={() => toggleNotification(setting.key)}
                />
                <label className="form-check-label" htmlFor={setting.key}>
                  {setting.label}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="col-12 col-md-6">
          <div className="card-plain p-4 mb-4">
            <h2 className="h5 mb-3">Order Summary</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Total Orders</span>
              <span className="fw-semibold">{orders.length}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Completed Orders</span>
              <span className="fw-semibold">{completedOrders}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Pending Orders</span>
              <span className="fw-semibold">{pendingOrders}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">Total Spend</span>
              <span className="fw-semibold">₹{totalSpend}</span>
            </div>
            <Link to="/orders" className="btn btn-outline-secondary w-100">View My Orders</Link>
          </div>

          <div className="card-plain p-4 mb-4">
            <h2 className="h5 mb-3">My Subscription</h2>
            {primarySubscription ? (
              <>
                <div className="fw-bold">{primarySubscription.productName}</div>
                <div className="text-muted small mb-3">
                  {primarySubscription.quantity} &times; {primarySubscription.variantName} &middot;{' '}
                  {primarySubscription.frequency}
                </div>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted small">Status</span>
                  <StatusBadge status={primarySubscription.status} />
                </div>
                <div className="d-flex justify-content-between mb-3">
                  <span className="text-muted small">Next Delivery</span>
                  <span className="small">{nextDeliveryLabel(primarySubscription)}</span>
                </div>
              </>
            ) : (
              <p className="text-muted mb-3">You don't have an active subscription yet.</p>
            )}
            <Link to="/subscription" className="btn btn-outline-secondary w-100">
              {primarySubscription ? 'Manage Subscription' : 'Start Subscription'}
            </Link>
          </div>

          <div className="card-plain p-4 mb-4">
            <h2 className="h5 mb-3">Fresh Points</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Current Points</span>
              <span className="fw-semibold">{loyalty.totalPoints}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Recently Earned</span>
              <span className="fw-semibold">+{loyalty.recentPoints}</span>
            </div>
            <p className="text-muted small mb-0">
              {loyalty.pointsToNextReward} points away from ₹{loyalty.rewardValue} off your next order.
            </p>
          </div>

          <button type="button" className="btn btn-outline-danger w-100" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-2"></i>
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
