import { useState } from 'react'
import { addProductionEntry, getProductionEntries } from '../../utils/production'

const initialForm = { date: '', morning: '', evening: '', wastage: '', notes: '' }

function AdminProduction() {
  const [entries, setEntries] = useState(getProductionEntries)
  const [form, setForm] = useState(initialForm)
  const [error, setError] = useState('')

  const morningValue = Number(form.morning) || 0
  const eveningValue = Number(form.evening) || 0
  const totalProduction = morningValue + eveningValue

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!form.date) return setError('Date is required.')
    if (form.morning === '' || form.evening === '') {
      return setError('Enter both morning and evening production.')
    }

    setError('')

    const updated = addProductionEntry({
      date: form.date,
      morning: morningValue,
      evening: eveningValue,
      wastage: Number(form.wastage) || 0,
      notes: form.notes.trim(),
    })

    setEntries(updated)
    setForm(initialForm)
  }

  return (
    <div>
      <h1 className="mb-4">Milk Production</h1>

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <div className="card-plain p-4">
            <h2 className="h5 mb-3">Log Production</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="prodDate">Date</label>
                <input
                  id="prodDate"
                  type="date"
                  className="form-control"
                  value={form.date}
                  onChange={(e) => updateField('date', e.target.value)}
                />
              </div>

              <div className="row g-3 mb-3">
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="morning">Morning (L)</label>
                  <input
                    id="morning"
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.morning}
                    onChange={(e) => updateField('morning', e.target.value)}
                  />
                </div>
                <div className="col-12 col-sm-6">
                  <label className="form-label" htmlFor="evening">Evening (L)</label>
                  <input
                    id="evening"
                    type="number"
                    min="0"
                    className="form-control"
                    value={form.evening}
                    onChange={(e) => updateField('evening', e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="wastage">Wastage (L)</label>
                <input
                  id="wastage"
                  type="number"
                  min="0"
                  className="form-control"
                  value={form.wastage}
                  onChange={(e) => updateField('wastage', e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  className="form-control"
                  rows="2"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                />
              </div>

              <div
                className="d-flex justify-content-between align-items-center mb-3 p-2 rounded-3"
                style={{ background: 'var(--color-primary-light)' }}
              >
                <span className="text-muted small">Total Production</span>
                <span className="fw-bold">{totalProduction} L</span>
              </div>

              {error && <div className="text-danger small mb-3">{error}</div>}

              <button type="submit" className="btn btn-brand w-100">Save Entry</button>
            </form>
          </div>
        </div>

        <div className="col-12 col-lg-7">
          <h2 className="h5 mb-3">Recent Entries</h2>
          <div className="card-plain p-0">
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Morning</th>
                    <th>Evening</th>
                    <th>Wastage</th>
                    <th>Total</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td>{entry.date}</td>
                      <td>{entry.morning} L</td>
                      <td>{entry.evening} L</td>
                      <td>{entry.wastage} L</td>
                      <td className="fw-semibold">{entry.total} L</td>
                      <td className="text-muted small">{entry.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProduction
