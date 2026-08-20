import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fallbackProductImage, popularProductNames } from '../data/mockProducts'

function handleImageError(event) {
  event.currentTarget.onerror = null
  event.currentTarget.src = fallbackProductImage
}

// A reusable card used on the Home and Products pages.
// `onAddToCart` is optional: when a page passes it (Products), the card
// becomes fully "shoppable" — a size selector plus Add to Cart. When
// it's omitted (Home's Popular Products preview), the card stays a
// simple browse-only preview with just a View Details link.
function ProductCard({ product, onAddToCart }) {
  const activeVariants = product.variants.filter((variant) => variant.isActive)
  const [selectedVariantId, setSelectedVariantId] = useState(activeVariants[0]?.id)
  const [justAdded, setJustAdded] = useState(false)
  const addedTimeoutRef = useRef(null)

  useEffect(() => {
    return () => clearTimeout(addedTimeoutRef.current)
  }, [])

  const selectedVariant =
    activeVariants.find((variant) => variant.id === selectedVariantId) ?? activeVariants[0]
  const inStock = Boolean(selectedVariant && selectedVariant.stock > 0)
  const isPopular = popularProductNames.includes(product.name)
  const isShoppable = Boolean(onAddToCart)

  function handleAddToCart() {
    if (!selectedVariant) return
    onAddToCart(product, selectedVariant)
    setJustAdded(true)
    clearTimeout(addedTimeoutRef.current)
    addedTimeoutRef.current = setTimeout(() => setJustAdded(false), 1500)
  }

  return (
    <div className="product-card card-plain h-100 d-flex flex-column overflow-hidden">
      <div className="product-card-image-wrap">
        <img
          src={product.image}
          alt={product.name}
          onError={handleImageError}
          className="product-card-image"
        />
        <span className="product-card-badge product-card-badge-category">{product.category}</span>
        {isPopular && <span className="product-card-badge product-card-badge-popular">Popular</span>}
      </div>

      <div className="p-3 d-flex flex-column flex-grow-1">
        <h5 className="mb-1">{product.name}</h5>
        <p className="text-muted small mb-2">{product.shortDescription}</p>

        {isShoppable && activeVariants.length > 1 && (
          <div className="mb-2">
            <label className="form-label small text-muted mb-1" htmlFor={`size-${product.id}`}>
              Size
            </label>
            <select
              id={`size-${product.id}`}
              className="form-select form-select-sm"
              value={selectedVariantId}
              onChange={(event) => setSelectedVariantId(event.target.value)}
            >
              {activeVariants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="d-flex align-items-end justify-content-between mb-3 mt-auto">
          <div>
            <span className="product-card-price">
              {selectedVariant ? `₹${selectedVariant.price}` : 'Unavailable'}
            </span>
            {selectedVariant && (
              <span className="text-muted small d-block">per {selectedVariant.name}</span>
            )}
          </div>
          <span className={`badge ${inStock ? 'text-bg-success' : 'text-bg-secondary'}`}>
            {inStock ? 'In Stock' : 'Out of Stock'}
          </span>
        </div>

        <div className="d-flex gap-2">
          <Link to={`/products/${product.id}`} className="btn btn-outline-secondary flex-grow-1">
            View Details
          </Link>
          {isShoppable && (
            <button
              type="button"
              className={`btn ${justAdded ? 'btn-success' : 'btn-brand'}`}
              disabled={!inStock}
              onClick={handleAddToCart}
            >
              {justAdded ? (
                <>
                  <i className="bi bi-check-lg me-1"></i>
                  Added
                </>
              ) : (
                'Add to Cart'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProductCard
