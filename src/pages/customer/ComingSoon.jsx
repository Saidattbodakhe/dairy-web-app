import { useState } from 'react'
import { addComingSoonLead } from '../../utils/comingSoon'

const initialForm = { name: '', phone: '', area: '', pincode: '' }

function ComingSoon() {
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!/^\d{10}$/.test(form.phone.trim())) {
      setError('Enter a valid 10-digit phone number.')
      return
    }
    if (!form.area.trim()) {
      setError('Area is required.')
      return
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setError('Enter a valid 6-digit pincode.')
      return
    }

    setError('')
    addComingSoonLead({
      name: form.name.trim(),
      phone: form.phone.trim(),
      area: form.area.trim(),
      pincode: form.pincode.trim(),
    })
    setSubmitted(true)
  }

  return (
    <div className="container py-5" style={{ maxWidth: '480px' }}>
      <div className="text-center mb-4">
        <i
          className="bi bi-signpost-split fs-1 d-block mb-2"
          style={{ color: 'var(--color-primary)' }}
        ></i>
        <h1>Coming Soon</h1>
        <p className="text-muted">We don't deliver to your location yet, but we're coming soon!</p>
      </div>

      {submitted ? (
        <div className="card-plain p-4 text-center">
          <i className="bi bi-check-circle-fill text-success fs-2 d-block mb-2"></i>
          <p className="mb-0">Thanks! We'll notify you as soon as we start delivering in your area.</p>
        </div>
      ) : (
        <form className="card-plain p-4" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="name">Name (optional)</label>
            <input
              id="name"
              type="text"
              className="form-control"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              className="form-control"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="area">Area</label>
            <input
              id="area"
              type="text"
              className="form-control"
              value={form.area}
              onChange={(e) => updateField('area', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="pincode">Pincode</label>
            <input
              id="pincode"
              type="text"
              inputMode="numeric"
              className="form-control"
              value={form.pincode}
              onChange={(e) => updateField('pincode', e.target.value)}
            />
          </div>

          {error && <div className="text-danger small mb-3">{error}</div>}

          <button type="submit" className="btn btn-brand w-100">Notify Me</button>
        </form>
      )}
    </div>
  )
}

export default ComingSoon
