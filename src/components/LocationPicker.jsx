import { useState } from 'react'
import Modal from './Modal'
import { useServiceLocation } from '../context/LocationContext'

const initialForm = { area: '', pincode: '' }

// The "clean location selection UI" fallback for when browser
// geolocation is denied/unavailable — plus the "Change Location" flow.
// Never blocks the rest of the app: it's a dismissible modal, not a
// dead end.
function LocationPicker() {
  const { isPickerOpen, isLocating, closeLocationPicker, requestBrowserLocation, selectManualLocation } =
    useServiceLocation()
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  if (!isPickerOpen) return null

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!form.area.trim()) {
      setError('Please enter your area.')
      return
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError('Enter a valid 6-digit pincode.')
      return
    }

    selectManualLocation({ area: form.area.trim(), pincode: form.pincode.trim() })
    setForm(initialForm)
  }

  return (
    <Modal title="Set Your Delivery Location" onClose={closeLocationPicker}>
      <p className="text-muted small">
        We use this to check whether we currently deliver to your area.
      </p>

      <button
        type="button"
        className="btn btn-outline-secondary w-100 mb-3"
        onClick={requestBrowserLocation}
        disabled={isLocating}
      >
        <i className="bi bi-geo-alt me-2"></i>
        {isLocating ? 'Detecting your location…' : 'Use My Current Location'}
      </button>

      <div className="d-flex align-items-center gap-2 text-muted small mb-3">
        <hr className="flex-grow-1" />
        or enter manually
        <hr className="flex-grow-1" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label" htmlFor="locationArea">Area</label>
          <input
            id="locationArea"
            type="text"
            className="form-control"
            placeholder="e.g. Hinjewadi Phase 1"
            value={form.area}
            onChange={(e) => updateField('area', e.target.value)}
          />
        </div>
        <div className="mb-3">
          <label className="form-label" htmlFor="locationPincode">Pincode</label>
          <input
            id="locationPincode"
            type="text"
            inputMode="numeric"
            className="form-control"
            placeholder="e.g. 411057"
            value={form.pincode}
            onChange={(e) => updateField('pincode', e.target.value)}
          />
        </div>

        {error && <div className="text-danger small mb-3">{error}</div>}

        <button type="submit" className="btn btn-brand w-100">Check Availability</button>
      </form>
    </Modal>
  )
}

export default LocationPicker
