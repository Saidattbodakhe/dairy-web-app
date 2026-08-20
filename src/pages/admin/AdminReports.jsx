import { useState } from 'react'
import {
  getSalesReport,
  getOrdersReport,
  getProductPerformanceReport,
  getMilkReport,
  getCustomersReport,
  getSubscriptionReport,
  getInventoryReport,
} from '../../utils/reports'
import { useProducts } from '../../context/ProductContext'

function AdminReports() {
  const { products: catalogProducts } = useProducts()
  const [exportMessage, setExportMessage] = useState('')
  const sales = getSalesReport()
  const orders = getOrdersReport()
  const products = getProductPerformanceReport()
  const milk = getMilkReport()
  const customers = getCustomersReport()
  const subscriptions = getSubscriptionReport()
  const inventory = getInventoryReport(catalogProducts)

  function handleExport(format) {
    setExportMessage(`${format} export isn't available in this demo phase yet.`)
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-4">
        <h1 className="mb-0">Reports</h1>
        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => handleExport('CSV')}>
            <i className="bi bi-file-earmark-spreadsheet me-1"></i> Export CSV
          </button>
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => handleExport('PDF')}>
            <i className="bi bi-file-earmark-pdf me-1"></i> Export PDF
          </button>
        </div>
      </div>

      {exportMessage && <div className="alert alert-info">{exportMessage}</div>}

      <div className="row g-4">
        {/* Sales reports */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Sales Reports</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Daily Sales</span>
              <span className="fw-semibold">₹{sales.dailySales}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Weekly Sales</span>
              <span className="fw-semibold">₹{sales.weeklySales}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Monthly Sales</span>
              <span className="fw-semibold">₹{sales.monthlySales}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">Total Revenue</span>
              <span className="fw-semibold">₹{sales.totalRevenue}</span>
            </div>
            <div className="fw-semibold mb-2">Product Sales</div>
            {sales.productSales.length === 0 ? (
              <p className="text-muted small mb-0">No sales yet.</p>
            ) : (
              sales.productSales.map((item) => (
                <div className="d-flex justify-content-between small mb-1" key={item.productName}>
                  <span>{item.productName}</span>
                  <span>{item.quantity} sold</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order reports */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Order Reports</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Total Orders</span>
              <span className="fw-semibold">{orders.total}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Delivered</span>
              <span className="fw-semibold">{orders.delivered}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Pending</span>
              <span className="fw-semibold">{orders.pending}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Cancelled</span>
              <span className="fw-semibold">{orders.cancelled}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Failed</span>
              <span className="fw-semibold">{orders.failed}</span>
            </div>
          </div>
        </div>

        {/* Product reports */}
        <div className="col-12">
          <div className="card-plain p-0">
            <h2 className="h5 p-4 pb-0 mb-3">Product Reports</h2>
            {products.length === 0 ? (
              <p className="text-muted small px-4 pb-4 mb-0">No product sales yet.</p>
            ) : (
              <div className="table-responsive">
                <table className="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((item) => (
                      <tr key={item.productName}>
                        <td className="fw-semibold">{item.productName}</td>
                        <td>{item.quantity}</td>
                        <td>₹{item.revenue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Milk / dairy reports */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Dairy / Milk Reports</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Milk Produced</span>
              <span className="fw-semibold">{milk.produced} L</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Milk Sold</span>
              <span className="fw-semibold">{milk.sold} L</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Remaining Milk</span>
              <span className="fw-semibold">{milk.remaining} L</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Wastage</span>
              <span className="fw-semibold">{milk.wastage} L</span>
            </div>
          </div>
        </div>

        {/* Customer reports */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Customer Reports</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Total Customers</span>
              <span className="fw-semibold">{customers.total}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">New Customers</span>
              <span className="fw-semibold">{customers.new}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Repeat Customers</span>
              <span className="fw-semibold">{customers.repeat}</span>
            </div>
          </div>
        </div>

        {/* Subscription reports */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Subscription Reports</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Active Subscriptions</span>
              <span className="fw-semibold">{subscriptions.active}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Paused Subscriptions</span>
              <span className="fw-semibold">{subscriptions.paused}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Cancelled Subscriptions</span>
              <span className="fw-semibold">{subscriptions.cancelled}</span>
            </div>
            <div className="d-flex justify-content-between mb-3">
              <span className="text-muted">New Subscribers (7 days)</span>
              <span className="fw-semibold">{subscriptions.newSubscribers}</span>
            </div>
            <div className="fw-semibold mb-2">Product Demand (Active)</div>
            {subscriptions.productDemand.length === 0 ? (
              <p className="text-muted small mb-0">No active subscription demand yet.</p>
            ) : (
              subscriptions.productDemand.map((item) => (
                <div className="d-flex justify-content-between small mb-1" key={item.productName}>
                  <span>{item.productName}</span>
                  <span>{item.quantity} / delivery</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Inventory reports */}
        <div className="col-12 col-md-6">
          <div className="card-plain p-4 h-100">
            <h2 className="h5 mb-3">Inventory Reports</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Current Stock</span>
              <span className="fw-semibold">{inventory.currentStock} units</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Low Stock Variants</span>
              <span className="fw-semibold">{inventory.lowStockCount}</span>
            </div>
            <div className="d-flex justify-content-between">
              <span className="text-muted">Out of Stock Variants</span>
              <span className="fw-semibold">{inventory.outOfStockCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminReports
