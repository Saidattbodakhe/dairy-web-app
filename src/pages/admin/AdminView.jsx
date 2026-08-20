import { Link } from 'react-router-dom'
import SummaryCard from '../../components/SummaryCard'
import {
  getSalesReport,
  getOrderOverview,
  getSubscriptionReport,
  getProductPerformanceReport,
  getInventoryReport,
} from '../../utils/reports'
import { useProducts } from '../../context/ProductContext'

const quickLinks = [
  { label: 'View Reports', to: '/admin/reports', icon: 'bi-bar-chart-line' },
  { label: 'Manage Orders', to: '/admin/orders', icon: 'bi-receipt' },
  { label: 'Manage Products', to: '/admin/products', icon: 'bi-box-seam' },
  { label: 'Manage Deliveries', to: '/admin/deliveries', icon: 'bi-truck' },
  // No dedicated subscription-management route exists yet — the
  // business-level subscription numbers already live on Reports.
  { label: 'Manage Subscriptions', to: '/admin/reports', icon: 'bi-arrow-repeat' },
  { label: 'Manage Inventory', to: '/admin/inventory', icon: 'bi-boxes' },
]

// Admin View — a business-facing overview reachable from the customer
// header (via "Admin View"), reusing the same admin auth guard, sidebar,
// and report/data utilities as the rest of /admin/*. It doesn't
// duplicate report logic: every number here comes straight from
// utils/reports.js and the centralized ProductContext.
function AdminView() {
  const { products } = useProducts()
  const sales = getSalesReport()
  const orderOverview = getOrderOverview()
  const subscriptions = getSubscriptionReport()
  const productPerformance = getProductPerformanceReport()
  const inventory = getInventoryReport(products)
  const totalProducts = products.length
  const bestSellers = productPerformance.slice(0, 3)

  const kpis = [
    { label: "Today's Orders", value: orderOverview.ordersToday, icon: 'bi-receipt' },
    { label: "Today's Deliveries", value: orderOverview.deliveriesToday, icon: 'bi-truck' },
    { label: 'Scheduled Orders', value: orderOverview.scheduled, icon: 'bi-calendar-check' },
    { label: 'Delivered Orders', value: orderOverview.delivered, icon: 'bi-box-seam-fill' },
    { label: 'Pending Orders', value: orderOverview.pending, icon: 'bi-hourglass-split' },
    { label: 'Active Subscribers', value: subscriptions.active, icon: 'bi-arrow-repeat' },
    { label: "Today's Sales", value: `₹${sales.dailySales}`, icon: 'bi-cash-coin' },
    { label: 'Pending Payments', value: orderOverview.pendingPayments, icon: 'bi-exclamation-circle' },
  ]

  return (
    <div>
      <div className="mb-4">
        <div className="text-uppercase small text-muted mb-1">Business Overview</div>
        <h1 className="mb-0">Admin View</h1>
      </div>

      {/* KPI cards */}
      <div className="row g-3 mb-4">
        {kpis.map((kpi) => (
          <div className="col-6 col-md-4 col-lg-3" key={kpi.label}>
            <SummaryCard icon={kpi.icon} label={kpi.label} value={kpi.value} />
          </div>
        ))}
      </div>

      <div className="row g-4 mb-4">
        {/* Order overview */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Order Overview</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Total Orders Today</span>
              <span className="fw-semibold">{orderOverview.ordersToday}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Scheduled Orders</span>
              <span className="fw-semibold">{orderOverview.scheduled}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Delivered Orders</span>
              <span className="fw-semibold">{orderOverview.delivered}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Pending Orders</span>
              <span className="fw-semibold">{orderOverview.pending}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Cancelled Orders</span>
              <span className="fw-semibold">{orderOverview.cancelled}</span>
            </div>
          </div>
        </div>

        {/* Delivery overview */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Delivery Overview</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Scheduled Deliveries</span>
              <span className="fw-semibold">{orderOverview.scheduled}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Out for Delivery</span>
              <span className="fw-semibold">{orderOverview.outForDelivery}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Delivered</span>
              <span className="fw-semibold">{orderOverview.delivered}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Failed Deliveries</span>
              <span className="fw-semibold">{orderOverview.failed}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 mb-4">
        {/* Subscription overview */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Subscription Overview</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Active Subscribers</span>
              <span className="fw-semibold">{subscriptions.active}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Paused Subscribers</span>
              <span className="fw-semibold">{subscriptions.paused}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Cancelled Subscribers</span>
              <span className="fw-semibold">{subscriptions.cancelled}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">New Subscribers (7 days)</span>
              <span className="fw-semibold">{subscriptions.newSubscribers}</span>
            </div>
          </div>
        </div>

        {/* Product overview */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Product Overview</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Total Products</span>
              <span className="fw-semibold">{totalProducts}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Low Stock Products</span>
              <span className="fw-semibold">{inventory.lowStockCount}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">Out of Stock Products</span>
              <span className="fw-semibold">{inventory.outOfStockCount}</span>
            </div>
            <div className="fw-semibold mb-2">Best Selling Products</div>
            {bestSellers.length === 0 ? (
              <p className="text-muted small mb-0">No sales yet.</p>
            ) : (
              bestSellers.map((item) => (
                <div className="d-flex justify-content-between small mb-1" key={item.productName}>
                  <span>{item.productName}</span>
                  <span>{item.quantity} sold</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sales overview */}
      <div className="card-plain p-4 mb-4">
        <h2 className="h5 mb-3">Sales Overview</h2>
        <div className="row g-3">
          <div className="col-12 col-sm-4">
            <div className="text-muted small">Today's Sales</div>
            <div className="fw-bold fs-5">₹{sales.dailySales}</div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="text-muted small">Weekly Sales</div>
            <div className="fw-bold fs-5">₹{sales.weeklySales}</div>
          </div>
          <div className="col-12 col-sm-4">
            <div className="text-muted small">Monthly Sales</div>
            <div className="fw-bold fs-5">₹{sales.monthlySales}</div>
          </div>
        </div>
      </div>

      {/* Quick management links */}
      <div className="card-plain p-4">
        <h2 className="h5 mb-3">Manage Business</h2>
        <div className="row g-3">
          {quickLinks.map((link) => (
            <div className="col-6 col-md-4 col-lg-2" key={link.label}>
              <Link
                to={link.to}
                className="btn btn-outline-secondary quick-action-card w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3 gap-2 text-decoration-none"
              >
                <i className={`bi ${link.icon} fs-4`}></i>
                <span className="small fw-semibold">{link.label}</span>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AdminView
