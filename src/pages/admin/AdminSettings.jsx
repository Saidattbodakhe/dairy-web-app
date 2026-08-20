import { useState } from 'react'
import { getSettings, updateSettings } from '../../utils/settings'

function AdminSettings() {
  const [settings, setSettings] = useState(getSettings)
  const [newSlot, setNewSlot] = useState('')
  const [saved, setSaved] = useState(false)

  function updateField(field, value) {
    setSettings((current) => ({ ...current, [field]: value }))
    setSaved(false)
  }

  function addSlot() {
    if (!newSlot.trim()) return
    setSettings((current) => ({
      ...current,
      deliverySlots: [...current.deliverySlots, newSlot.trim()],
    }))
    setNewSlot('')
    setSaved(false)
  }

  function removeSlot(slot) {
    setSettings((current) => ({
      ...current,
      deliverySlots: current.deliverySlots.filter((candidate) => candidate !== slot),
    }))
    setSaved(false)
  }

  function handleSave(event) {
    event.preventDefault()
    updateSettings(settings)
    setSaved(true)
  }

  return (
    <div>
      <h1 className="mb-4">Settings</h1>

      <form onSubmit={handleSave}>
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <div className="card-plain p-4 mb-4">
              <h2 className="h5 mb-3">Business Settings</h2>
              <div className="mb-3">
                <label className="form-label" htmlFor="businessName">Business Name</label>
                <input
                  id="businessName"
                  type="text"
                  className="form-control"
                  value={settings.businessName}
                  onChange={(e) => updateField('businessName', e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="businessAddress">Business Address</label>
                <textarea
                  id="businessAddress"
                  className="form-control"
                  rows="2"
                  value={settings.businessAddress}
                  onChange={(e) => updateField('businessAddress', e.target.value)}
                />
              </div>
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="area">Area</label>
                  <input
                    id="area"
                    type="text"
                    className="form-control"
                    value={settings.area}
                    onChange={(e) => updateField('area', e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="pincode">Pincode</label>
                  <input
                    id="pincode"
                    type="text"
                    inputMode="numeric"
                    className="form-control"
                    value={settings.pincode}
                    onChange={(e) => updateField('pincode', e.target.value)}
                  />
                </div>
              </div>
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="latitude">Latitude</label>
                  <input
                    id="latitude"
                    type="text"
                    className="form-control"
                    value={settings.latitude}
                    onChange={(e) => updateField('latitude', e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="longitude">Longitude</label>
                  <input
                    id="longitude"
                    type="text"
                    className="form-control"
                    value={settings.longitude}
                    onChange={(e) => updateField('longitude', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="serviceRadius">Service Radius (KM)</label>
                <input
                  id="serviceRadius"
                  type="number"
                  min="1"
                  className="form-control"
                  style={{ maxWidth: '160px' }}
                  value={settings.serviceRadiusKm}
                  onChange={(e) => updateField('serviceRadiusKm', Number(e.target.value))}
                />
              </div>
              <p className="text-muted small mt-3 mb-0">
                Latitude/longitude are stored as plain text for now — real map-based validation
                comes in the backend phase.
              </p>
            </div>

            <div className="card-plain p-4">
              <h2 className="h5 mb-3">Delivery Settings</h2>
              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="deliveryCharge">Standard Delivery Charge (₹)</label>
                  <input
                    id="deliveryCharge"
                    type="number"
                    min="0"
                    className="form-control"
                    value={settings.standardDeliveryCharge}
                    onChange={(e) => updateField('standardDeliveryCharge', Number(e.target.value))}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="freeDeliveryAbove">Free Delivery Above (₹)</label>
                  <input
                    id="freeDeliveryAbove"
                    type="number"
                    min="0"
                    className="form-control"
                    value={settings.freeDeliveryAbove}
                    onChange={(e) => updateField('freeDeliveryAbove', Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="form-label" htmlFor="cutoff">
                  Order Cancellation Cutoff (hours before delivery)
                </label>
                <input
                  id="cutoff"
                  type="number"
                  min="0"
                  className="form-control"
                  style={{ maxWidth: '160px' }}
                  value={settings.cancellationCutoffHours}
                  onChange={(e) => updateField('cancellationCutoffHours', Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="card-plain p-4">
              <h2 className="h5 mb-3">Delivery Slots</h2>
              <div className="d-flex flex-column gap-2 mb-3">
                {settings.deliverySlots.map((slot) => (
                  <div
                    className="d-flex justify-content-between align-items-center border rounded-3 px-3 py-2"
                    key={slot}
                  >
                    <span>{slot}</span>
                    <button
                      type="button"
                      className="btn btn-link text-danger btn-sm p-0"
                      onClick={() => removeSlot(slot)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 10:00 AM – 12:00 PM"
                  value={newSlot}
                  onChange={(e) => setNewSlot(e.target.value)}
                />
                <button type="button" className="btn btn-outline-secondary" onClick={addSlot}>
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>

        {saved && <div className="alert alert-success mt-4">Settings saved.</div>}

        <button type="submit" className="btn btn-brand mt-4">Save Settings</button>
      </form>
    </div>
  )
}

export default AdminSettings
