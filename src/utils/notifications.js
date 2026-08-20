// Frontend-only notification log — no push/SMS/WhatsApp, just a demo
// feed stored in localStorage that the Header's bell icon reads from.
const NOTIFICATIONS_STORAGE_KEY = 'dairy_notifications'
const MAX_NOTIFICATIONS = 30

function loadNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveNotifications(notifications) {
  localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications))
}

export function getNotifications() {
  return loadNotifications().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export function addNotification(message) {
  const notifications = loadNotifications()
  const notification = {
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    message,
    createdAt: new Date().toISOString(),
    read: false,
  }

  const updated = [notification, ...notifications].slice(0, MAX_NOTIFICATIONS)
  saveNotifications(updated)
  return updated
}

export function markAllAsRead() {
  const updated = loadNotifications().map((notification) => ({ ...notification, read: true }))
  saveNotifications(updated)
  return updated
}

export function getUnreadCount() {
  return loadNotifications().filter((notification) => !notification.read).length
}
