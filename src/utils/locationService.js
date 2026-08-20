import { getSettings } from './settings'

// Demo-only pincode → distance lookup, standing in for a real geocoding
// API (none is allowed in this frontend-only phase). Distances are
// approximate straight-line km from Hinjewadi Phase 1 (411057), just
// enough to demonstrate the 20km service-area rule realistically.
const PINCODE_DEMO_DATA = {
  '411057': { areaLabel: 'Hinjewadi Phase 1', distanceKm: 0 },
  '411033': { areaLabel: 'Wakad', distanceKm: 6 },
  '411027': { areaLabel: 'Baner', distanceKm: 9 },
  '411045': { areaLabel: 'Balewadi', distanceKm: 12 },
  '411038': { areaLabel: 'Pimple Saudagar', distanceKm: 15 },
  '411017': { areaLabel: 'Aundh', distanceKm: 22 },
  '400001': { areaLabel: 'Mumbai', distanceKm: 150 },
  '110001': { areaLabel: 'New Delhi', distanceKm: 1400 },
}

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

// Haversine formula — great-circle distance between two lat/lon points
// in kilometres. This is the only "geolocation math" this app does; no
// mapping/geocoding library is used.
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const EARTH_RADIUS_KM = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_KM * c
}

// The business location/service radius live in utils/settings.js (one
// configuration location, already used by Admin Settings) — this just
// reads it back out in a shape convenient for distance checks.
export function getServiceAreaConfig() {
  const settings = getSettings()
  return {
    businessName: settings.businessName,
    area: settings.area,
    pincode: settings.pincode,
    latitude: Number(settings.latitude),
    longitude: Number(settings.longitude),
    serviceRadiusKm: Number(settings.serviceRadiusKm),
  }
}

// Given real coordinates (from the browser Geolocation API), work out
// whether they fall inside the configured service radius.
export function checkCoordinatesInServiceArea(latitude, longitude) {
  const config = getServiceAreaConfig()
  const distanceKm = calculateDistanceKm(config.latitude, config.longitude, latitude, longitude)
  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    withinRadius: distanceKm <= config.serviceRadiusKm,
  }
}

// Manual pincode entry has no real geocoding behind it — an unknown
// pincode is treated as OUTSIDE the service area by default. That's the
// safer, more honest business default: better to say "not yet available
// here" than to wrongly promise delivery.
export function checkPincodeInServiceArea(pincode) {
  const config = getServiceAreaConfig()
  const known = PINCODE_DEMO_DATA[pincode.trim()]

  if (!known) {
    return { distanceKm: null, withinRadius: false, areaLabel: null }
  }

  return {
    distanceKm: known.distanceKm,
    withinRadius: known.distanceKm <= config.serviceRadiusKm,
    areaLabel: known.areaLabel,
  }
}
