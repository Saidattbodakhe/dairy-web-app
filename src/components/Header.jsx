import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import NotificationBell from './NotificationBell'

// `useState` lets a component remember a value between renders.
// Here it remembers whether the mobile menu is open or closed.
function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { cartCount } = useCart()

  const navLinkClass = ({ isActive }) =>
    `nav-link-custom${isActive ? ' active' : ''}`

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="border-bottom bg-white sticky-top">
      <div className="container d-flex align-items-center justify-content-between py-2">
        <Link
          to="/"
          className="d-flex align-items-center gap-2 fw-bold fs-5 text-decoration-none"
          style={{ color: 'var(--color-primary)' }}
          onClick={closeMenu}
        >
          <i className="bi bi-droplet-fill"></i>
          Fresh Dairy
        </Link>

        <nav className="d-none d-lg-flex align-items-center gap-3 gap-xl-4">
          <NavLink to="/" className={navLinkClass}>Home</NavLink>
          <NavLink to="/products" className={navLinkClass}>Products</NavLink>
          <NavLink to="/orders" className={navLinkClass}>My Orders</NavLink>
          <NavLink to="/subscription" className={navLinkClass}>Subscription</NavLink>
          <NavLink to="/profile" className={navLinkClass}>Profile</NavLink>
          <NavLink to="/admin/view" className={navLinkClass}>Admin View</NavLink>
          <NotificationBell />
          <Link to="/cart" className="btn btn-brand position-relative">
            <i className="bi bi-cart3 me-1"></i>
            Cart
            {cartCount > 0 && (
              <span className="badge rounded-pill bg-danger position-absolute top-0 start-100 translate-middle">
                {cartCount}
              </span>
            )}
          </Link>
        </nav>

        <button
          type="button"
          className="btn d-lg-none fs-4 border-0"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <i className={`bi ${menuOpen ? 'bi-x-lg' : 'bi-list'}`}></i>
        </button>
      </div>

      {menuOpen && (
        <nav className="d-lg-none border-top bg-white">
          <div className="container d-flex flex-column py-2">
            <Link to="/" className="py-2" onClick={closeMenu}>Home</Link>
            <Link to="/products" className="py-2" onClick={closeMenu}>Products</Link>
            <Link to="/orders" className="py-2" onClick={closeMenu}>My Orders</Link>
            <Link to="/subscription" className="py-2" onClick={closeMenu}>Subscription</Link>
            <Link to="/profile" className="py-2" onClick={closeMenu}>Profile</Link>
            <Link to="/admin/view" className="py-2" onClick={closeMenu}>Admin View</Link>
            <div className="py-2 d-flex align-items-center gap-2">
              <span>Notifications</span>
              <NotificationBell />
            </div>
            <Link to="/cart" className="py-2" onClick={closeMenu}>
              Cart{cartCount > 0 ? ` (${cartCount})` : ''}
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}

export default Header
