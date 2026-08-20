import { useState } from 'react'
import { getNotifications, markAllAsRead } from '../utils/notifications'
import { getOrders } from '../utils/orders'

const ACTIVE_STATUSES = ['Placed', 'Confirmed', 'Preparing', 'Out for Delivery']

function getTomorrowIso() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.toISOString().split('T')[0]
}

// "Your next delivery is tomorrow" isn't a one-time event like the
// others, so instead of storing it, it's computed fresh from real
// order data every time the panel opens.
function getComputedReminders() {
  const tomorrowIso = getTomorrowIso()
  const hasTomorrowDelivery = getOrders().some(
    (order) => order.deliveryDate === tomorrowIso && ACTIVE_STATUSES.includes(order.status)
  )

  if (!hasTomorrowDelivery) return []

  return [
    {
      id: `reminder-tomorrow-${tomorrowIso}`,
      message: 'Your next delivery is tomorrow.',
      createdAt: new Date().toISOString(),
      read: false,
    },
  ]
}

function formatWhen(isoString) {
  const date = new Date(isoString)
  const isToday = date.toDateString() === new Date().toDateString()
  return isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString()
}

function loadAllNotifications() {
  return [...getComputedReminders(), ...getNotifications()]
}

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(loadAllNotifications)

  const unreadCount = notifications.filter((notification) => !notification.read).length

  function toggleOpen() {
    setOpen((current) => {
      const next = !current
      // Refresh on open so anything triggered since the last open
      // (placing an order, a status change, etc.) shows up.
      if (next) setNotifications(loadAllNotifications())
      return next
    })
  }

  function handleMarkAllRead() {
    markAllAsRead()
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))
  }

  return (
    <div className="position-relative">
      <button
        type="button"
        className="btn border-0 fs-4 position-relative"
        aria-label="Notifications"
        onClick={toggleOpen}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span
            className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle"
            style={{ fontSize: '0.6rem' }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100"
            style={{ zIndex: 1040 }}
            onClick={() => setOpen(false)}
          ></div>
          <div
            className="position-absolute end-0 bg-white border rounded-3 shadow-sm"
            style={{
              width: '320px',
              maxWidth: '90vw',
              maxHeight: '360px',
              overflowY: 'auto',
              zIndex: 1050,
              top: 'calc(100% + 8px)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <span className="fw-semibold">Notifications</span>
              {unreadCount > 0 && (
                <button type="button" className="btn btn-link btn-sm p-0" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="text-muted small p-3 text-center">No notifications yet.</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-3 border-bottom small"
                  style={{ background: notification.read ? 'transparent' : 'var(--color-primary-light)' }}
                >
                  <div>{notification.message}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {formatWhen(notification.createdAt)}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default NotificationBell
