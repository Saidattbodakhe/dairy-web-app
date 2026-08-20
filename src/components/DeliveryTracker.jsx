const routeStages = ['Farm', 'Local Hub', 'Your Area', 'Delivered']
const CURRENT_STAGE_INDEX = 2 // "Your Area" — this component only renders for "Out for Delivery"

function getEstimatedArrival(deliverySlot) {
  const parts = deliverySlot.split('–').map((part) => part.trim())
  return parts[1] ?? deliverySlot
}

// Shown only when an order's status is "Out for Delivery". This is a
// simple demo visual — there is no real GPS or live location behind
// it, and the copy below says so explicitly.
function DeliveryTracker({ order }) {
  return (
    <div className="card-plain p-4">
      <div className="d-flex align-items-center gap-2 mb-3">
        <i className="bi bi-truck fs-4" style={{ color: 'var(--color-primary)' }}></i>
        <div>
          <div className="fw-bold">Out for Delivery</div>
          <div className="text-muted small">Your delivery partner is on the way.</div>
        </div>
      </div>

      <div className="row g-3 mb-3">
        <div className="col-6 col-md-3">
          <div className="text-muted small">Delivery Slot</div>
          <div className="fw-semibold">{order.deliverySlot}</div>
        </div>
        <div className="col-6 col-md-3">
          <div className="text-muted small">Estimated Arrival</div>
          <div className="fw-semibold">By {getEstimatedArrival(order.deliverySlot)}</div>
        </div>
      </div>

      <div className="d-flex justify-content-between mb-1">
        {routeStages.map((stage, index) => (
          <div key={stage} className="text-center flex-fill">
            <div
              className="rounded-circle mx-auto mb-1"
              style={{
                width: '14px',
                height: '14px',
                background:
                  index <= CURRENT_STAGE_INDEX ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            ></div>
            <div className={`small ${index === CURRENT_STAGE_INDEX ? 'fw-semibold' : 'text-muted'}`}>
              {stage}
            </div>
          </div>
        ))}
      </div>
      <div className="progress mb-2" style={{ height: '4px' }}>
        <div className="progress-bar" style={{ width: '66%', background: 'var(--color-primary)' }}></div>
      </div>

      <p className="text-muted small mb-0">
        <i className="bi bi-info-circle me-1"></i>
        Demo tracking for illustration only — not a live GPS location.
      </p>
    </div>
  )
}

export default DeliveryTracker
