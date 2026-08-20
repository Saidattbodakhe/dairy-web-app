const STATUS_COLORS = {
  Placed: 'text-bg-secondary',
  Confirmed: 'text-bg-info',
  Preparing: 'text-bg-warning',
  'Out for Delivery': 'text-bg-primary',
  Delivered: 'text-bg-success',
  Cancelled: 'text-bg-danger',
  Paid: 'text-bg-success',
  Pending: 'text-bg-warning',
  Failed: 'text-bg-danger',
  Active: 'text-bg-success',
  Inactive: 'text-bg-secondary',
  Paused: 'text-bg-warning',
  'Low Stock': 'text-bg-warning',
  'In Stock': 'text-bg-success',
}

function StatusBadge({ status }) {
  const colorClass = STATUS_COLORS[status] || 'text-bg-secondary'
  return <span className={`badge ${colorClass}`}>{status}</span>
}

export default StatusBadge
