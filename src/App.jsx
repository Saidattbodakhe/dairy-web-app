import { Routes, Route } from 'react-router-dom'
import CustomerLayout from './components/CustomerLayout'
import AdminLayout from './components/AdminLayout'

import Home from './pages/customer/Home'
import Products from './pages/customer/Products'
import ProductDetail from './pages/customer/ProductDetail'
import Cart from './pages/customer/Cart'
import Checkout from './pages/customer/Checkout'
import Login from './pages/customer/Login'
import Orders from './pages/customer/Orders'
import OrderDetail from './pages/customer/OrderDetail'
import Profile from './pages/customer/Profile'
import ComingSoon from './pages/customer/ComingSoon'
import Subscription from './pages/customer/Subscription'

import AdminLogin from './pages/admin/AdminLogin'
import AdminView from './pages/admin/AdminView'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminOrders from './pages/admin/AdminOrders'
import AdminCustomers from './pages/admin/AdminCustomers'
import AdminDeliveries from './pages/admin/AdminDeliveries'
import AdminInventory from './pages/admin/AdminInventory'
import AdminProduction from './pages/admin/AdminProduction'
import AdminReports from './pages/admin/AdminReports'
import AdminSettings from './pages/admin/AdminSettings'
import AdminComingSoon from './pages/admin/AdminComingSoon'
import AdminHomePage from './pages/admin/AdminHomePage'

import NotFound from './pages/NotFound'

// <Routes> looks at the current browser URL and renders whichever
// <Route> matches. The customer routes are nested inside CustomerLayout
// so they all share the same Header/Footer; admin routes get their own
// layout later (Checkpoint 12), so for now they render on their own.
function App() {
  return (
    <Routes>
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/coming-soon" element={<ComingSoon />} />
        <Route path="/subscription" element={<Subscription />} />
      </Route>

      <Route path="/admin/login" element={<AdminLogin />} />

      {/* AdminLayout renders the sidebar/header and redirects to
          /admin/login if there's no demo admin session. */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route path="view" element={<AdminView />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="deliveries" element={<AdminDeliveries />} />
        <Route path="inventory" element={<AdminInventory />} />
        <Route path="home-page" element={<AdminHomePage />} />
        <Route path="production" element={<AdminProduction />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="coming-soon" element={<AdminComingSoon />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default App
