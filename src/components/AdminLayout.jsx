import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { useAdminAuth } from '../context/AdminAuthContext'

// Guards every /admin/* page (except the login page itself, which sits
// outside this layout in App.jsx): if there's no demo admin session,
// bounce to /admin/login instead of rendering the dashboard.
function AdminLayout() {
  const { isAdminLoggedIn, isLoading } = useAdminAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Session restore is now an async Supabase call — wait for it before
  // deciding to redirect, otherwise an already-logged-in admin would
  // flash to /admin/login on every refresh.
  if (isLoading) {
    return (
      <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-secondary" role="status">
          <span className="visually-hidden">Loading…</span>
        </div>
      </div>
    )
  }

  if (!isAdminLoggedIn) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <div className={`admin-sidebar bg-white border-end ${sidebarOpen ? 'admin-sidebar-open' : ''}`}>
        <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      {sidebarOpen && (
        <div
          className="admin-sidebar-backdrop d-lg-none"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <div className="flex-grow-1 d-flex flex-column" style={{ minWidth: 0 }}>
        <AdminHeader onToggleSidebar={() => setSidebarOpen((open) => !open)} />
        <main className="flex-grow-1 p-3 p-md-4" style={{ background: 'var(--color-bg-soft)' }}>
          <div className="admin-content-max">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
