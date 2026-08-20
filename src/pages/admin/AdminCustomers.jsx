import { useState } from 'react'
import Modal from '../../components/Modal'
import StatusBadge from '../../components/StatusBadge'
import { getCustomers, getCustomerOrders } from '../../utils/customers'
import { getSubscriptions } from '../../utils/subscriptions'

function AdminCustomers() {
  const [customers] = useState(getCustomers)
  const [search, setSearch] = useState('')
  const [viewingCustomer, setViewingCustomer] = useState(null)

  const term = search.trim().toLowerCase()
  const filteredCustomers = customers.filter(
    (customer) =>
      term === '' ||
      customer.name.toLowerCase().includes(term) ||
      customer.phone.includes(term) ||
      (customer.email || '').toLowerCase().includes(term)
  )

  const activeSubscriptionCount = getSubscriptions().filter((sub) => sub.status === 'Active').length
  const viewingOrders = viewingCustomer ? getCustomerOrders(viewingCustomer.phone) : []
  const latestAddress = viewingOrders[0]?.address

  return (
    <div>
      <h1 className="mb-4">Customers</h1>

      <div className="card-plain p-3 mb-4">
        <input
          type="search"
          className="form-control"
          placeholder="Search by name, phone, or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="text-center text-muted py-5">
          <i className="bi bi-people fs-1 d-block mb-2"></i>
          {customers.length === 0
            ? 'No customers yet — they appear here once orders are placed.'
            : 'No customers found.'}
        </div>
      ) : (
        <div className="card-plain p-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Total Orders</th>
                  <th>Total Spend</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.phone}>
                    <td className="fw-semibold">{customer.name}</td>
                    <td>{customer.phone}</td>
                    <td>{customer.email || '—'}</td>
                    <td>{customer.totalOrders}</td>
                    <td>₹{customer.totalSpend}</td>
                    <td><StatusBadge status={customer.status} /></td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setViewingCustomer(customer)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewingCustomer && (
        <Modal title={viewingCustomer.name} onClose={() => setViewingCustomer(null)}>
          <h3 className="h6">Profile</h3>
          <div className="mb-1"><span className="text-muted">Phone:</span> {viewingCustomer.phone}</div>
          <div className="mb-3"><span className="text-muted">Email:</span> {viewingCustomer.email || 'Not provided'}</div>

          <h3 className="h6">Address</h3>
          {latestAddress ? (
            <p className="text-muted small mb-3">
              {latestAddress.line1}, {latestAddress.city}, {latestAddress.state} - {latestAddress.pincode}
            </p>
          ) : (
            <p className="text-muted small mb-3">No address on file.</p>
          )}

          <h3 className="h6">Recent Orders</h3>
          <div className="mb-3">
            {viewingOrders.map((order) => (
              <div className="d-flex justify-content-between small py-1 border-bottom" key={order.orderNumber}>
                <span>{order.orderNumber}</span>
                <StatusBadge status={order.status} />
                <span>₹{order.grandTotal}</span>
              </div>
            ))}
          </div>

          <h3 className="h6">Subscription</h3>
          <p className="text-muted small mb-0">
            {activeSubscriptionCount} active subscription(s) across the demo customer base.
          </p>
        </Modal>
      )}
    </div>
  )
}

export default AdminCustomers
