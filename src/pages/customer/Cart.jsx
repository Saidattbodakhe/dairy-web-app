import { Link } from 'react-router-dom'
import CartItem from '../../components/CartItem'
import { useCart } from '../../context/CartContext'
import { useProducts } from '../../context/ProductContext'
import { useServiceLocation } from '../../context/LocationContext'
import { calculateDeliveryCharge } from '../../utils/orderTotals'
import { resolveCartLines } from '../../utils/cartPricing'

function Cart() {
  const { items, increaseQuantity, decreaseQuantity, removeItem, clearCart } = useCart()
  const { getProductById } = useProducts()
  const { isOutsideServiceArea } = useServiceLocation()

  if (items.length === 0) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-cart-x fs-1 text-muted d-block mb-3"></i>
        <h1>Your cart is empty</h1>
        <p className="text-muted">Add some fresh dairy products to get started.</p>
        <Link to="/products" className="btn btn-brand">Browse Products</Link>
      </div>
    )
  }

  const resolvedLines = resolveCartLines(items, getProductById)
  const hasUnavailableItems = resolvedLines.some((line) => !line.isAvailable)
  // Only currently-purchasable lines count toward the total the customer
  // will actually be charged — unavailable lines stay visible (never
  // silently removed) but don't inflate the order total.
  const subtotal = resolvedLines
    .filter((line) => line.isAvailable)
    .reduce((total, line) => total + line.currentPrice * line.item.quantity, 0)
  const deliveryCharge = calculateDeliveryCharge(subtotal)
  const discount = 0
  const grandTotal = subtotal + deliveryCharge - discount
  const amountLeftForFreeDelivery = 500 - subtotal
  const canCheckout = !isOutsideServiceArea && !hasUnavailableItems

  return (
    <div className="container py-4 py-md-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Your Cart</h1>
        <button type="button" className="btn btn-outline-danger btn-sm" onClick={clearCart}>
          Clear Cart
        </button>
      </div>

      {isOutsideServiceArea && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-geo-alt-fill me-2"></i>
          Delivery is currently unavailable in your location.
        </div>
      )}

      {hasUnavailableItems && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          Some items in your cart are no longer available. Remove them to continue to checkout.
        </div>
      )}

      <div className="row g-4">
        <div className="col-12 col-lg-8">
          <div className="card-plain p-3 p-md-4">
            {resolvedLines.map(({ item, currentPrice, isAvailable, stock }) => (
              <div key={`${item.productId}-${item.variantId}`}>
                {!isAvailable && (
                  <div className="text-danger small fw-semibold mt-3">
                    <i className="bi bi-x-circle-fill me-1"></i>
                    No longer available
                  </div>
                )}
                <CartItem
                  item={{ ...item, price: currentPrice }}
                  onIncrease={() => isAvailable && increaseQuantity(item.productId, item.variantId)}
                  onDecrease={() => decreaseQuantity(item.productId, item.variantId)}
                  onRemove={() => removeItem(item.productId, item.variantId)}
                  disableIncrease={!isAvailable || item.quantity >= stock}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card-plain p-4">
            <h2 className="h5 mb-3">Order Summary</h2>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Subtotal</span>
              <span>₹{subtotal}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Delivery Charge</span>
              <span>{deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}</span>
            </div>
            <div className="d-flex justify-content-between mb-2">
              <span className="text-muted">Discount</span>
              <span>−₹{discount}</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between fw-bold fs-5 mb-3">
              <span>Grand Total</span>
              <span>₹{grandTotal}</span>
            </div>

            {amountLeftForFreeDelivery > 0 && (
              <p className="small text-muted">
                Add ₹{amountLeftForFreeDelivery} more to get free delivery.
              </p>
            )}

            {canCheckout ? (
              <Link to="/checkout" className="btn btn-accent btn-lg w-100">
                Proceed to Checkout
              </Link>
            ) : (
              <button type="button" className="btn btn-accent btn-lg w-100" disabled>
                Proceed to Checkout
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
