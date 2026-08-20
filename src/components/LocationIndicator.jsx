import { useServiceLocation } from '../context/LocationContext'

// A small, always-visible pill showing the resolved delivery area
// (never a precise address) with a one-tap way to change it. Sits below
// the existing Header instead of inside it, so Header itself is untouched.
function LocationIndicator() {
  const { status, areaLabel, isResolved, isLocating, openLocationPicker } = useServiceLocation()

  if (isLocating) {
    return (
      <div className="location-indicator-bar">
        <div className="container py-2 small text-muted d-flex align-items-center gap-2">
          <i className="bi bi-geo-alt"></i> Detecting your location…
        </div>
      </div>
    )
  }

  return (
    <div className="location-indicator-bar">
      <div className="container py-2 small d-flex align-items-center justify-content-between gap-2 flex-wrap">
        <span className="d-flex align-items-center gap-1">
          <i className="bi bi-geo-alt-fill" style={{ color: 'var(--color-primary)' }}></i>
          {isResolved ? areaLabel : 'Location not set'}
        </span>
        <button type="button" className="btn btn-link btn-sm p-0" onClick={openLocationPicker}>
          {status === 'location_denied' || !isResolved ? 'Set Location' : 'Change Location'}
        </button>
      </div>
    </div>
  )
}

export default LocationIndicator
