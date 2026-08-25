import { useLocation, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../context/AdminAuthContext'

// Maps the current /admin/* path to a readable section name, so the
// header always reflects where the admin actually is instead of a
// static "Admin Dashboard" label.
const SECTION_TITLES = {
  view: 'Admin View',
  dashboard: 'Dashboard',
  products: 'Products',
  orders: 'Orders',
  customers: 'Customers',
  deliveries: 'Deliveries',
  inventory: 'Inventory',
  'home-page': 'Home Page',
  production: 'Milk Production',
  reports: 'Reports',
  settings: 'Settings',
  'coming-soon': 'Coming Soon',
}

function getSectionTitle(pathname) {
  const segment = pathname.split('/')[2]
  return SECTION_TITLES[segment] ?? 'Admin'
}

function AdminHeader({ onToggleSidebar }) {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  function handleLogout() {
    logout()
    navigate('/admin/login')
  }

  return (
    <header className="admin-header bg-white border-bottom d-flex align-items-center justify-content-between px-3 py-2">
      <div className="d-flex align-items-center gap-2">
        <button
          type="button"
          className="btn d-lg-none fs-4 border-0"
          aria-label="Toggle menu"
          onClick={onToggleSidebar}
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="d-none d-lg-flex flex-column lh-sm">
          <span className="text-muted small text-uppercase" style={{ letterSpacing: '0.04em' }}>
            Fresh Dairy &middot; Admin View
          </span>
          <span className="fw-semibold">{getSectionTitle(location.pathname)}</span>
        </div>

        <span className="fw-semibold d-lg-none">{getSectionTitle(location.pathname)}</span>
      </div>

      <div className="d-flex align-items-center gap-3">
        <span className="text-muted small d-none d-sm-inline">{admin?.email}</span>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  )
}

export default AdminHeader
