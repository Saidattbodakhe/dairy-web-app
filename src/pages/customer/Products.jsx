import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/ProductCard'
import { getStartingPrice } from '../../data/mockProducts'
import { useCart } from '../../context/CartContext'
import { useProducts } from '../../context/ProductContext'
import { useServiceLocation } from '../../context/LocationContext'

// "Popular" keeps the catalog's own order (no fabricated popularity
// score exists in the mock data). Price sorting uses real variant
// prices. "Newest" was left out on purpose — there's no created-date
// field to sort by honestly.
const sortOptions = [
  { value: 'popular', label: 'Popular' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

function Products() {
  const { products, isLoading, error } = useProducts()
  const { isOutsideServiceArea } = useServiceLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [sortBy, setSortBy] = useState('popular')
  const { addItem } = useCart()

  // Built from the product data itself, so this never has to be
  // updated by hand when a product's category changes.
  const categories = useMemo(
    () => ['All', ...new Set(products.map((product) => product.category))],
    [products]
  )

  function handleAddToCart(product, variant) {
    addItem(product, variant, 1)
  }

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()

    const matches = products.filter((product) => {
      if (!product.isActive) return false

      const matchesCategory = activeCategory === 'All' || product.category === activeCategory
      const matchesSearch =
        term === '' ||
        product.name.toLowerCase().includes(term) ||
        product.category.toLowerCase().includes(term) ||
        product.shortDescription.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)

      return matchesCategory && matchesSearch
    })

    const sorted = [...matches]
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => (getStartingPrice(a) ?? Infinity) - (getStartingPrice(b) ?? Infinity))
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => (getStartingPrice(b) ?? -Infinity) - (getStartingPrice(a) ?? -Infinity))
    }
    // 'popular' needs no sort — the catalog's natural order is used as-is.

    return sorted
  }, [products, searchTerm, activeCategory, sortBy])

  const totalActiveCount = useMemo(
    () => products.filter((product) => product.isActive).length,
    [products]
  )
  const isFiltered = searchTerm.trim() !== '' || activeCategory !== 'All'

  return (
    <div>
      {/* Page header */}
      <section className="pt-4 pt-md-5 pb-3">
        <div className="container text-center">
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
            style={{ width: '56px', height: '56px', background: 'var(--color-primary-light)' }}
          >
            <i className="bi bi-droplet-fill fs-4" style={{ color: 'var(--color-primary)' }}></i>
          </div>
          <h1 className="mb-2">Fresh Dairy Products</h1>
          <p className="text-muted mb-0">
            Fresh milk and quality dairy products delivered straight to your doorstep.
          </p>
        </div>
      </section>

      {isOutsideServiceArea ? (
        <div className="container pb-5">
          <div className="text-center text-muted py-5">
            <i className="bi bi-signpost-split fs-1 d-block mb-3" style={{ color: 'var(--color-primary)' }}></i>
            <h2 className="h4 mb-2">We're Not Delivering To Your Area Yet</h2>
            <p className="mb-3">
              We currently deliver within 20 km of Hinjewadi Phase 1. We're working to bring
              fresh dairy products to your location soon.
            </p>
            <Link to="/coming-soon" className="btn btn-brand">
              Notify Me When You Launch Here
            </Link>
          </div>
        </div>
      ) : isLoading ? (
        <div className="container pb-5 text-center py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : error ? (
        <div className="container pb-5">
          <div className="alert alert-danger text-center">{error}</div>
        </div>
      ) : (
      <div className="container pb-5">
        {/* Search */}
        <div className="search-input-wrap mb-3">
          <i className="bi bi-search search-input-icon"></i>
          <input
            type="search"
            className="form-control search-input"
            placeholder="Search milk, curd, paneer, ghee..."
            aria-label="Search products"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        {/* Category navigation — horizontally scrollable, never wraps */}
        <div className="category-scroll mb-3">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-chip ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Shopping toolbar */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div className="text-muted small">
            {isFiltered
              ? `Showing ${filteredProducts.length} of ${totalActiveCount} products`
              : `${totalActiveCount} products`}
          </div>
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="sortBy" className="small text-muted mb-0">
              Sort By
            </label>
            <select
              id="sortBy"
              className="form-select form-select-sm"
              style={{ width: 'auto' }}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product grid / empty state */}
        {filteredProducts.length === 0 ? (
          <div className="text-center text-muted py-5">
            <i className="bi bi-search fs-1 d-block mb-3"></i>
            <h2 className="h5 mb-2">No dairy products found</h2>
            <p className="mb-3">Try another search or browse a different category.</p>
            <div className="d-flex gap-2 justify-content-center flex-wrap">
              {searchTerm && (
                <button type="button" className="btn btn-outline-secondary" onClick={() => setSearchTerm('')}>
                  Clear Search
                </button>
              )}
              {activeCategory !== 'All' && (
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setActiveCategory('All')}
                >
                  View All Products
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {filteredProducts.map((product) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={product.id}>
                <ProductCard product={product} onAddToCart={handleAddToCart} />
              </div>
            ))}
          </div>
        )}
      </div>
      )}
    </div>
  )
}

export default Products
