import { useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/ProductCard'
import HeroCarousel from '../../components/HeroCarousel'
import { popularProductNames } from '../../data/mockProducts'
import { useProducts } from '../../context/ProductContext'
import { useServiceLocation } from '../../context/LocationContext'
import { getProductInterest, addProductInterest } from '../../utils/productInterest'

const offers = [
  { title: '₹50 OFF', detail: 'On your first order with us' },
  { title: 'Free Delivery', detail: 'On all orders above ₹500' },
  { title: 'Save 10%', detail: 'When you subscribe to daily milk delivery' },
]

const farmFreshQuality = [
  { icon: 'bi-flower1', title: 'Farm-Fresh Quality', detail: 'Milked from our own 12 cows each morning and delivered the same day.' },
  { icon: 'bi-tag-fill', title: 'Better Value', detail: 'Direct farm-to-door pricing, with no middlemen marking up your daily dairy.' },
  { icon: 'bi-truck', title: 'Reliable Daily Delivery', detail: 'Set your schedule once and count on it arriving in your chosen slot.' },
  { icon: 'bi-patch-check-fill', title: 'Trusted Dairy Products', detail: 'Every batch is checked for quality before it leaves the farm.' },
  { icon: 'bi-people-fill', title: 'Support Local Farmers', detail: 'Every order goes directly to our small local dairy and its community.' },
]

// Purely a teaser — these are NOT real catalog products (no id/variants,
// nothing here ever reaches ProductContext), so there's no way for them
// to accidentally become purchasable.
const futureProducts = [
  { name: 'A2 Milk', icon: 'bi-droplet-half' },
  { name: 'Fresh Cream', icon: 'bi-cup-hot' },
  { name: 'Flavoured Milk', icon: 'bi-cup-straw' },
  { name: 'Traditional Buttermilk', icon: 'bi-moisture' },
]

function Home() {
  const { products } = useProducts()
  const { isOutsideServiceArea, areaLabel } = useServiceLocation()
  const [notified, setNotified] = useState(getProductInterest)

  const popularProducts = products.filter(
    (product) => product.isActive && popularProductNames.includes(product.name)
  )

  function handleNotify(productName) {
    setNotified(addProductInterest(productName))
  }

  // Outside the 20km demo service area — no shopping sections at all,
  // just the friendly "we're not here yet" message. Cart/Checkout enforce
  // the same rule independently (see LocationContext + Cart/Checkout).
  if (isOutsideServiceArea) {
    return (
      <div className="container py-5 text-center" style={{ maxWidth: '560px' }}>
        <i
          className="bi bi-signpost-split fs-1 d-block mb-3"
          style={{ color: 'var(--color-primary)' }}
        ></i>
        <h1 className="mb-2">Coming Soon To Your Area</h1>
        <p className="text-muted mb-4">
          We currently deliver within 20 km of Hinjewadi Phase 1. We're working to bring fresh
          dairy products to your location soon.
        </p>
        {areaLabel && (
          <p className="small text-muted mb-4">
            <i className="bi bi-geo-alt me-1"></i>
            Detected area: {areaLabel}
          </p>
        )}
        <Link to="/coming-soon" className="btn btn-brand">
          Notify Me When You Launch Here
        </Link>
      </div>
    )
  }

  return (
    <div>
      {/* Hero carousel: intro text slide + product/farm scenes */}
      <HeroCarousel />

      {/* Popular products */}
      <section id="popular-products" className="section pt-0">
        <div className="container">
          <h2 className="mb-4">Popular Products</h2>
          <div className="row g-4">
            {popularProducts.map((product) => (
              <div className="col-12 col-sm-6 col-lg-3" key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Offers */}
      <section className="section pt-0">
        <div className="container">
          <h2 className="mb-4">Offers For You</h2>
          <div className="row g-3">
            {offers.map((offer) => (
              <div className="col-12 col-md-4" key={offer.title}>
                <div
                  className="p-4 rounded-4 h-100"
                  style={{ background: 'var(--color-primary-light)' }}
                >
                  <div className="fw-bold fs-5 mb-1" style={{ color: 'var(--color-primary-dark)' }}>
                    {offer.title}
                  </div>
                  <div className="text-muted">{offer.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Farm-fresh quality */}
      <section className="section pt-0">
        <div className="container">
          <h2 className="mb-4">Farm-Fresh Quality</h2>
          <div className="row row-cols-2 row-cols-md-3 row-cols-lg-5 g-4">
            {farmFreshQuality.map((item) => (
              <div className="text-center" key={item.title}>
                <i
                  className={`bi ${item.icon} mb-2`}
                  style={{ fontSize: '2rem', color: 'var(--color-primary)' }}
                ></i>
                <div className="fw-semibold">{item.title}</div>
                <div className="text-muted small">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Coming Soon — a teaser only. These products
          are not in the catalog, cannot be added to cart, and have no
          checkout path. */}
      <section className="section pt-0">
        <div className="container">
          <h2 className="mb-1">Coming Soon</h2>
          <p className="text-muted mb-4">More fresh dairy products are coming soon.</p>
          <div className="row row-cols-2 row-cols-md-4 g-3">
            {futureProducts.map((item) => {
              const isNotified = notified.includes(item.name)
              return (
                <div className="col" key={item.name}>
                  <div className="card-plain p-3 h-100 text-center d-flex flex-column">
                    <i
                      className={`bi ${item.icon} mb-2`}
                      style={{ fontSize: '1.75rem', color: 'var(--color-primary)' }}
                    ></i>
                    <div className="fw-semibold small mb-2 flex-grow-1">{item.name}</div>
                    <button
                      type="button"
                      className={`btn btn-sm ${isNotified ? 'btn-outline-success' : 'btn-outline-secondary'}`}
                      onClick={() => handleNotify(item.name)}
                      disabled={isNotified}
                    >
                      {isNotified ? (
                        <>
                          <i className="bi bi-check2 me-1"></i>
                          We'll Notify You
                        </>
                      ) : (
                        'Notify Me'
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="section pt-0">
        <div className="container">
          <div
            className="rounded-4 p-4 p-md-5 text-center text-md-start d-flex flex-column flex-md-row align-items-center justify-content-between gap-4"
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
              color: '#fff',
            }}
          >
            <div>
              <h2 className="text-white mb-2">Ready For Fresh Dairy, Every Day?</h2>
              <p className="mb-0" style={{ color: 'rgba(255, 255, 255, 0.85)' }}>
                Order a one-time delivery or set up a daily milk subscription — your choice.
              </p>
            </div>
            <div className="d-flex flex-column flex-sm-row gap-3 flex-shrink-0">
              <Link to="/products" className="btn btn-accent btn-lg">
                Shop Now
              </Link>
              <Link to="/subscription" className="btn btn-outline-light btn-lg">
                Start Subscription
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
