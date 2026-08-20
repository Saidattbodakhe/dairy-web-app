import { Link } from 'react-router-dom'
import SummaryCard from '../../components/SummaryCard'
import StatusBadge from '../../components/StatusBadge'
import {
  summaryStats,
  orderStatusSummary,
  milkPosition,
  deliverySlotPositions,
  actionRequired,
} from '../../data/mockDashboard'

function AdminDashboard() {
  return (
    <div>
      <h1 className="mb-4">Dashboard</h1>

      {/* Top summary cards */}
      <div className="row g-3 mb-4">
        {summaryStats.map((stat) => (
          <div className="col-6 col-md-4 col-lg-3" key={stat.label}>
            <SummaryCard icon={stat.icon} label={stat.label} value={stat.value} />
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        {/* Order status summary */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Order Status Summary</h2>
            <div className="d-flex flex-wrap gap-2">
              {orderStatusSummary.map((item) => (
                <div
                  key={item.status}
                  className="d-flex align-items-center justify-content-between gap-2 border rounded-3 px-3 py-2 flex-grow-1"
                  style={{ minWidth: '140px' }}
                >
                  <StatusBadge status={item.status} />
                  <span className="fw-bold">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Milk position */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Milk Position</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Production</span>
              <span className="fw-semibold">{milkPosition.production} L</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subscriptions</span>
              <span className="fw-semibold">{milkPosition.subscriptions} L</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">One-Time Orders</span>
              <span className="fw-semibold">{milkPosition.oneTimeOrders} L</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between">
              <span className="fw-bold">Available</span>
              <span className="fw-bold" style={{ color: 'var(--color-primary-dark)' }}>
                {milkPosition.available} L
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Delivery slots */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Delivery Slots</h2>
            {deliverySlotPositions.map((slot) => (
              <div className="mb-3" key={slot.slot}>
                <div className="d-flex justify-content-between small mb-1">
                  <span>{slot.slot}</span>
                  <span className="text-muted">{slot.booked} / {slot.capacity}</span>
                </div>
                <div className="progress" style={{ height: '8px' }}>
                  <div
                    className="progress-bar"
                    style={{
                      width: `${Math.min(100, (slot.booked / slot.capacity) * 100)}%`,
                      background: 'var(--color-primary)',
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action required */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Action Required</h2>
            <div className="d-flex flex-column gap-2">
              {actionRequired.map((item) => (
                <Link
                  key={item.label}
                  to={item.link}
                  className="d-flex align-items-center justify-content-between border rounded-3 px-3 py-2 text-decoration-none"
                  style={{ color: 'var(--color-text)' }}
                >
                  <span>
                    <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                    {item.label}
                  </span>
                  <span className="badge text-bg-warning">{item.count}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
