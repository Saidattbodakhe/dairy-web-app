import { fallbackProductImage } from '../data/mockProducts'

function CartItem({ item, onIncrease, onDecrease, onRemove, disableIncrease = false }) {
  const lineTotal = item.price * item.quantity

  return (
    <div className="d-flex align-items-center gap-3 py-3 border-bottom flex-wrap">
      <img
        src={item.image}
        alt={item.productName}
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = fallbackProductImage
        }}
        style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
      />

      <div className="flex-grow-1">
        <div className="fw-semibold">{item.productName}</div>
        <div className="text-muted small">{item.variantName}</div>
        <div className="fw-semibold">₹{item.price}</div>
      </div>

      <div className="d-inline-flex align-items-center border rounded-3">
        <button type="button" className="btn btn-sm" aria-label="Decrease quantity" onClick={onDecrease}>
          −
        </button>
        <span className="px-3">{item.quantity}</span>
        <button
          type="button"
          className="btn btn-sm"
          aria-label="Increase quantity"
          onClick={onIncrease}
          disabled={disableIncrease}
        >
          +
        </button>
      </div>

      <div className="fw-bold text-end" style={{ minWidth: '70px' }}>
        ₹{lineTotal}
      </div>

      <button type="button" className="btn btn-link text-danger" aria-label="Remove item" onClick={onRemove}>
        <i className="bi bi-trash"></i>
      </button>
    </div>
  )
}

export default CartItem
