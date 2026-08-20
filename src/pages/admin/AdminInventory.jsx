import StatusBadge from '../../components/StatusBadge'
import { useProducts } from '../../context/ProductContext'
import { milkPositionMock, calculateMilkAvailability, LOW_STOCK_THRESHOLD } from '../../utils/inventory'

function AdminInventory() {
  const { products } = useProducts()
  const { totalDemand, available, isShortfall, shortfallAmount } =
    calculateMilkAvailability(milkPositionMock)

  const otherProducts = products.filter((product) => product.category !== 'Milk')

  return (
    <div>
      <h1 className="mb-4">Inventory</h1>

      <div className="card-plain p-4 mb-4">
        <h2 className="h5 mb-3">Milk</h2>

        <div className="row g-3 mb-3">
          <div className="col-6 col-md-3">
            <div className="text-muted small">Production</div>
            <div className="fw-bold fs-5">{milkPositionMock.production} L</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-muted small">Subscription Demand</div>
            <div className="fw-bold fs-5">{milkPositionMock.subscriptionDemand} L</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-muted small">One-Time Order Demand</div>
            <div className="fw-bold fs-5">{milkPositionMock.oneTimeOrderDemand} L</div>
          </div>
          <div className="col-6 col-md-3">
            <div className="text-muted small">Wastage</div>
            <div className="fw-bold fs-5">{milkPositionMock.wastage} L</div>
          </div>
        </div>

        <div
          className="d-flex justify-content-between align-items-center p-3 rounded-3"
          style={{ background: isShortfall ? '#fdecea' : 'var(--color-primary-light)' }}
        >
          <span className="fw-semibold">Available</span>
          <span
            className="fw-bold fs-5"
            style={{ color: isShortfall ? 'var(--color-danger)' : 'var(--color-primary-dark)' }}
          >
            {available} L
          </span>
        </div>

        {isShortfall ? (
          <div className="text-danger small mt-2">
            <i className="bi bi-exclamation-triangle-fill me-1"></i>
            WARNING — Milk demand ({totalDemand} L) is {shortfallAmount} L higher than expected
            production ({milkPositionMock.production} L).
          </div>
        ) : (
          <div className="text-muted small mt-2">
            Demand ({totalDemand} L) is within today's expected production.
          </div>
        )}
      </div>

      <h2 className="h5 mb-3">Other Products</h2>
      <div className="card-plain p-0">
        <div className="table-responsive">
          <table className="table align-middle mb-0">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Total Stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {otherProducts.map((product) => {
                const totalStock = product.variants.reduce(
                  (sum, variant) => sum + (variant.isActive ? variant.stock : 0),
                  0
                )
                const isLowStock = totalStock < LOW_STOCK_THRESHOLD

                return (
                  <tr key={product.id}>
                    <td className="fw-semibold">{product.name}</td>
                    <td>{product.category}</td>
                    <td>{totalStock} units</td>
                    <td>
                      <StatusBadge status={isLowStock ? 'Low Stock' : 'In Stock'} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default AdminInventory
