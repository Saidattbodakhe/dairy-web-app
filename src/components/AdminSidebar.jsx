import { NavLink } from 'react-router-dom'

// Grouped like a modern admin nav instead of one flat list — every
// route here already existed before this reorganization, nothing new
// was added or removed.
const menuGroups = [
  {
    label: 'Overview',
    items: [
      { label: 'Overview', icon: 'bi-graph-up', to: '/admin/view' },
      { label: 'Dashboard', icon: 'bi-speedometer2', to: '/admin/dashboard' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Orders', icon: 'bi-receipt', to: '/admin/orders' },
      { label: 'Deliveries', icon: 'bi-truck', to: '/admin/deliveries' },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', icon: 'bi-box-seam', to: '/admin/products' },
      { label: 'Inventory', icon: 'bi-boxes', to: '/admin/inventory' },
      { label: 'Home Page', icon: 'bi-window', to: '/admin/home-page' },
    ],
  },
  {
    label: 'Business',
    items: [
      { label: 'Customers', icon: 'bi-people', to: '/admin/customers' },
      { label: 'Milk Production', icon: 'bi-droplet-half', to: '/admin/production' },
      { label: 'Coming Soon', icon: 'bi-signpost-split', to: '/admin/coming-soon' },
    ],
  },
  {
    label: 'Analytics',
    items: [{ label: 'Reports', icon: 'bi-bar-chart-line', to: '/admin/reports' }],
  },
  {
    label: 'Settings',
    items: [{ label: 'Settings', icon: 'bi-gear', to: '/admin/settings' }],
  },
]

function AdminSidebar({ onNavigate }) {
  return (
    <nav className="d-flex flex-column p-3 h-100">
      <div
        className="fw-bold fs-5 mb-4 d-flex align-items-center gap-2 flex-shrink-0"
        style={{ color: 'var(--color-primary)' }}
      >
        <i className="bi bi-droplet-fill"></i>
        Fresh Dairy Admin
      </div>

      <div className="d-flex flex-column gap-4 overflow-y-auto">
        {menuGroups.map((group) => (
          <div key={group.label}>
            <div className="admin-nav-group-label">{group.label}</div>
            <div className="d-flex flex-column gap-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => `admin-nav-link${isActive ? ' active' : ''}`}
                  onClick={onNavigate}
                >
                  <i className={`bi ${item.icon} me-2`}></i>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}

export default AdminSidebar
