const SETTINGS_STORAGE_KEY = 'dairy_admin_settings'

const defaultSettings = {
  businessName: 'Fresh Dairy',
  businessAddress: 'Hinjewadi Phase 1, Pune, Maharashtra - 411057',
  area: 'Hinjewadi Phase 1',
  pincode: '411057',
  latitude: '18.5929',
  longitude: '73.7450',
  serviceRadiusKm: 20,
  standardDeliveryCharge: 30,
  freeDeliveryAbove: 500,
  cancellationCutoffHours: 12,
  deliverySlots: ['6:00 AM – 8:00 AM', '8:00 AM – 10:00 AM', '5:00 PM – 7:00 PM'],
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings
  } catch {
    return defaultSettings
  }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings))
}

export function getSettings() {
  return loadSettings()
}

export function updateSettings(changes) {
  const updated = { ...loadSettings(), ...changes }
  saveSettings(updated)
  return updated
}
