import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchActiveHeroSlides } from '../services/heroSlideService'

const SLIDE_INTERVAL_MS = 6000
const SWIPE_THRESHOLD_PX = 40

function resolveSlideLink(slide) {
  if (slide.ctaType === 'product' && slide.productId) return `/products/${slide.productId}`
  return slide.ctaRoute || '/products'
}

// A small dependency-free carousel — React state for which slide is
// active, plus a CSS transform to slide the track. No external
// carousel library needed for something this simple.
function HeroCarousel() {
  const [slides, setSlides] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef(null)
  const prefersReducedMotion = useRef(false)

  // Admin-managed slides, loaded from Supabase (home_hero_slides) —
  // only active slides come back, already ordered by display_order.
  useEffect(() => {
    let isMounted = true

    fetchActiveHeroSlides()
      .then((data) => {
        if (isMounted) setSlides(data)
      })
      .catch((error) => {
        console.error('Failed to load hero slides:', error.message)
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
  }, [])

  useEffect(() => {
    if (isPaused || prefersReducedMotion.current || slides.length === 0) return undefined

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

  // Nothing to show yet (still loading, or Admin has no active slides
  // configured) — collapse rather than render an empty/broken carousel.
  if (isLoading || slides.length === 0) return null

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
            key={slide.id}
            aria-hidden={slideIndex !== index}
          >
            <div className="container">
              <div className="row align-items-center g-4 py-4 py-lg-5">
                <div className="col-12 col-md-6">
                  <h1 className="hero-carousel-heading fw-bold mb-3">{slide.title}</h1>
                  <p className="fs-5 text-muted mb-4">{slide.description}</p>
                  <div className="d-flex flex-column flex-sm-row gap-3">
                    {slide.ctaText && (
                      <Link to={resolveSlideLink(slide)} className="btn btn-accent btn-lg">
                        {slide.ctaText}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <img src={slide.imageUrl} alt={slide.title} className="hero-carousel-image" />
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
      {slides.length > 1 && (
        <>
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
                key={slide.id}
                type="button"
                className={`hero-carousel-dot ${slideIndex === index ? 'active' : ''}`}
                aria-label={`Go to slide ${slideIndex + 1}`}
                aria-current={slideIndex === index}
                onClick={() => goTo(slideIndex)}
              ></button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

export default HeroCarousel
