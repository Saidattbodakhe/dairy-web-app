import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fallbackProductImage } from '../../data/mockProducts'
import { useCart } from '../../context/CartContext'
import { useProducts } from '../../context/ProductContext'

// useParams reads the dynamic part of the URL — for a route like
// "/products/:id", visiting "/products/3" makes id equal "3".
function ProductDetail() {
  const { id } = useParams()
  const { addItem } = useCart()
  const { getProductById } = useProducts()
  const rawProduct = getProductById(id)
  const product = rawProduct && rawProduct.isActive ? rawProduct : null
  const activeVariants = product ? product.variants.filter((variant) => variant.isActive) : []

  // React requires the same hooks to run on every render of a component,
  // so useState has to be called before the "not found" early return below
  // — otherwise navigating from a valid product straight to an invalid
  // one (without the page remounting) would break React's hook tracking.
  const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id)
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  if (!product) {
    return (
      <div className="container py-5 text-center">
        <i className="bi bi-emoji-frown fs-1 text-muted d-block mb-3"></i>
        <h1>Product Not Found</h1>
        <p className="text-muted">We couldn't find the product you're looking for.</p>
        <Link to="/products" className="btn btn-brand">Back to Products</Link>
      </div>
    )
  }

  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId)
  const inStock = Boolean(selectedVariant && selectedVariant.stock > 0)

  function selectVariant(variantId) {
    setSelectedVariantId(variantId)
    setQuantity(1)
    setJustAdded(false)
  }

  function changeQuantity(delta) {
    setQuantity((current) => {
      const next = current + delta
      const max = selectedVariant?.stock ?? 1
      if (next < 1) return 1
      if (next > max) return max
      return next
    })
  }

  function handleAddToCart() {
    addItem(product, selectedVariant, quantity)
    setJustAdded(true)
  }

  return (
    <div className="container py-4 py-md-5">
      <Link to="/products" className="d-inline-flex align-items-center gap-1 text-muted mb-4">
        <i className="bi bi-arrow-left"></i> Back to Products
      </Link>

      <div className="row g-4">
        <div className="col-12 col-md-6">
          <img
            src={product.image}
            alt={product.name}
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = fallbackProductImage
            }}
            className="w-100 rounded-4"
            style={{ maxHeight: '360px', objectFit: 'cover' }}
          />
        </div>

        <div className="col-12 col-md-6">
          <span className="text-uppercase small text-muted">{product.category}</span>
          <h1 className="mb-2">{product.name}</h1>
          <p className="text-muted">{product.description}</p>

          <div className="mb-3">
            <div className="fw-semibold mb-2">Choose a size</div>
            <div className="d-flex flex-wrap gap-2">
              {activeVariants.map((variant) => (
                <button
                  key={variant.id}
                  type="button"
                  className={`btn btn-sm ${
                    selectedVariantId === variant.id ? 'btn-brand' : 'btn-outline-secondary'
                  }`}
                  onClick={() => selectVariant(variant.id)}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>

          {selectedVariant && (
            <>
              <div className="d-flex align-items-center gap-3 mb-3">
                <span className="fs-4 fw-bold">₹{selectedVariant.price}</span>
                <span className={`badge ${inStock ? 'text-bg-success' : 'text-bg-secondary'}`}>
                  {inStock ? `In Stock (${selectedVariant.stock} left)` : 'Out of Stock'}
                </span>
              </div>

              <div className="mb-4">
                <div className="fw-semibold mb-2">Quantity</div>
                <div className="d-inline-flex align-items-center border rounded-3">
                  <button
                    type="button"
                    className="btn btn-lg"
                    aria-label="Decrease quantity"
                    onClick={() => changeQuantity(-1)}
                    disabled={!inStock || quantity <= 1}
                  >
                    −
                  </button>
                  <span className="px-4 fw-semibold">{quantity}</span>
                  <button
                    type="button"
                    className="btn btn-lg"
                    aria-label="Increase quantity"
                    onClick={() => changeQuantity(1)}
                    disabled={!inStock || quantity >= selectedVariant.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="btn btn-accent btn-lg w-100 w-sm-auto"
                disabled={!inStock}
                onClick={handleAddToCart}
              >
                <i className="bi bi-cart-plus me-2"></i>
                Add to Cart
              </button>

              {justAdded && (
                <div className="text-success mt-2">
                  <i className="bi bi-check-circle-fill me-1"></i>
                  Added to cart
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
