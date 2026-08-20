function SummaryCard({ icon, label, value }) {
  return (
    <div className="card-plain summary-card p-3 h-100">
      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
        <div className="text-muted small">{label}</div>
        <div
          className="d-flex align-items-center justify-content-center rounded-3 flex-shrink-0"
          style={{
            width: '38px',
            height: '38px',
            background: 'var(--color-primary-light)',
            color: 'var(--color-primary-dark)',
            fontSize: '1.1rem',
          }}
        >
          <i className={`bi ${icon}`}></i>
        </div>
      </div>
      <div className="fw-bold summary-card-value">{value}</div>
    </div>
  )
}

export default SummaryCard
