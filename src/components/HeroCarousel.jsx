import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import freshMilkGlassImage from '../assets/products/fresh-cow-milk.jpg'
import cowGrazingImage from '../assets/carousel/cow-grazing.jpg'
import milkPouringImage from '../assets/carousel/milk-pouring.jpg'
import gheeImage from '../assets/products/ghee.jpg'
import curdImage from '../assets/products/curd.jpg'
import { useProducts } from '../context/ProductContext'

const PRODUCTS_FALLBACK_ROUTE = '/products'

function productRoute(product) {
  return product ? `/products/${product.id}` : PRODUCTS_FALLBACK_ROUTE
}

const SLIDE_INTERVAL_MS = 6000
const SWIPE_THRESHOLD_PX = 40

// A small dependency-free carousel — React state for which slide is
// active, plus a CSS transform to slide the track. No external
// carousel library needed for something this simple.
function HeroCarousel() {
  const { getProductByName } = useProducts()
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef(null)
  const prefersReducedMotion = useRef(false)

  // Looked up from the centralized product Context (not hardcoded
  // routes), so a CTA never points at a product id that doesn't exist.
  const slides = useMemo(() => {
    const milkProduct = getProductByName('Cow Milk')
    const gheeProduct = getProductByName('Cow Ghee')
    const curdProduct = getProductByName('Curd')

    return [
      {
        heading: 'Fresh Dairy Delivered To Your Door',
        text: 'Fresh milk and dairy products from our farm, delivered straight to your home every day.',
        image: freshMilkGlassImage,
        alt: 'A glass of fresh milk',
        primaryCta: { label: 'ORDER MILK', to: PRODUCTS_FALLBACK_ROUTE },
        secondaryCta: { label: 'VIEW PRODUCTS', href: '#popular-products' },
      },
      {
        heading: 'Fresh From Our Farm',
        text: 'Fresh milk begins with healthy cows, clean surroundings, and quality feed.',
        image: cowGrazingImage,
        alt: 'A Jersey cow grazing on fresh green grass',
        primaryCta: { label: 'EXPLORE OUR MILK', to: productRoute(milkProduct) },
      },
      {
        heading: 'Pure Fresh Milk, Every Day',
        text: "Fresh dairy milk delivered to your doorstep, ready for your family's morning.",
        image: milkPouringImage,
        alt: 'Fresh milk being poured into a glass',
        primaryCta: { label: 'ORDER FRESH MILK', to: productRoute(milkProduct) },
      },
      {
        heading: 'Pure Dairy Ghee',
        text: 'Rich, traditional dairy ghee made for everyday cooking and delicious meals.',
        image: gheeImage,
        alt: 'A jar of pure dairy ghee',
        primaryCta: { label: 'VIEW GHEE', to: productRoute(gheeProduct) },
      },
      {
        heading: 'Fresh Creamy Curd',
        text: 'Fresh, creamy curd made from quality dairy milk and delivered to your home.',
        image: curdImage,
        alt: 'A bowl of fresh creamy curd',
        primaryCta: { label: 'VIEW CURD', to: productRoute(curdProduct) },
      },
    ]
  }, [getProductByName])

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  }, [])

  useEffect(() => {
    if (isPaused || prefersReducedMotion.current) return undefined

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % slides.length)
    }, SLIDE_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [isPaused, slides.length])

  // Any manual navigation (arrow, dot, swipe, keyboard) pauses
  // auto-advance for the rest of the visit, per the "pause on
  // interaction" requirement.
  function goTo(nextIndex) {
    setIndex((nextIndex + slides.length) % slides.length)
    setIsPaused(true)
  }

  function handleKeyDown(event) {
    if (event.key === 'ArrowLeft') goTo(index - 1)
    if (event.key === 'ArrowRight') goTo(index + 1)
  }

  function handleTouchStart(event) {
    touchStartX.current = event.touches[0].clientX
  }

  function handleTouchEnd(event) {
    if (touchStartX.current === null) return

    const deltaX = event.changedTouches[0].clientX - touchStartX.current
    if (deltaX > SWIPE_THRESHOLD_PX) goTo(index - 1)
    else if (deltaX < -SWIPE_THRESHOLD_PX) goTo(index + 1)

    touchStartX.current = null
  }

  return (
    <section
      className="hero-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label="Fresh Dairy showcase"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="hero-carousel-track"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, slideIndex) => (
          <div
            className="hero-carousel-slide"
            key={slide.heading}
            aria-hidden={slideIndex !== index}
          >
            <div className="container">
              <div className="row align-items-center g-4 py-4 py-lg-5">
                <div className="col-12 col-md-6">
                  <h1 className="hero-carousel-heading fw-bold mb-3">{slide.heading}</h1>
                  <p className="fs-5 text-muted mb-4">{slide.text}</p>
                  <div className="d-flex flex-column flex-sm-row gap-3">
                    <Link to={slide.primaryCta.to} className="btn btn-accent btn-lg">
                      {slide.primaryCta.label}
                    </Link>
                    {slide.secondaryCta && (
                      <a href={slide.secondaryCta.href} className="btn btn-outline-secondary btn-lg">
                        {slide.secondaryCta.label}
                      </a>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <img src={slide.image} alt={slide.alt} className="hero-carousel-image" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Below md, the slide still stacks text above image (there isn't
          room to sit them side by side), which makes the slide tall —
          vertically centering an arrow in that would land it awkwardly
          over the text. Swipe + dots already cover navigation there. */}
      <button
        type="button"
        className="hero-carousel-arrow hero-carousel-arrow-prev d-none d-md-flex"
        aria-label="Previous slide"
        onClick={() => goTo(index - 1)}
      >
        <i className="bi bi-chevron-left"></i>
      </button>
      <button
        type="button"
        className="hero-carousel-arrow hero-carousel-arrow-next d-none d-md-flex"
        aria-label="Next slide"
        onClick={() => goTo(index + 1)}
      >
        <i className="bi bi-chevron-right"></i>
      </button>

      <div className="hero-carousel-dots">
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.heading}
            type="button"
            className={`hero-carousel-dot ${slideIndex === index ? 'active' : ''}`}
            aria-label={`Go to slide ${slideIndex + 1}`}
            aria-current={slideIndex === index}
            onClick={() => goTo(slideIndex)}
          ></button>
        ))}
      </div>
    </section>
  )
}

export default HeroCarousel
