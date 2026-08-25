import { useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import HeroSlideForm from '../../components/HeroSlideForm'
import StatusBadge from '../../components/StatusBadge'
import { fallbackProductImage } from '../../data/mockProducts'
import { useProducts } from '../../context/ProductContext'
import {
  fetchAllHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  setHeroSlideActive,
} from '../../services/heroSlideService'

// Admin management for the Home page's Hero Carousel — deliberately
// mirrors AdminProducts.jsx's table + Add/Edit modal structure so it
// feels native to the rest of Admin View rather than a new pattern.
function AdminHomePage() {
  const { products } = useProducts()
  const [slides, setSlides] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [editingSlide, setEditingSlide] = useState(null)
  const [showForm, setShowForm] = useState(false)

  // Reusable after a save/toggle (event-handler triggered, not tied to
  // the mount effect below).
  async function loadSlides() {
    try {
      const data = await fetchAllHeroSlides()
      setSlides(data)
    } catch (error) {
      console.error('Failed to load hero slides:', error.message)
      setActionError('Unable to load hero slides right now.')
    }
  }

  useEffect(() => {
    let isMounted = true

    async function loadOnMount() {
      try {
        const data = await fetchAllHeroSlides()
        if (isMounted) setSlides(data)
      } catch (error) {
        console.error('Failed to load hero slides:', error.message)
        if (isMounted) setActionError('Unable to load hero slides right now.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadOnMount()

    return () => {
      isMounted = false
    }
  }, [])

  function openAddForm() {
    setEditingSlide(null)
    setShowForm(true)
  }

  function openEditForm(slide) {
    setEditingSlide(slide)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingSlide(null)
  }

  async function handleSave(slideData) {
    setActionError('')
    try {
      if (editingSlide) {
        await updateHeroSlide(editingSlide.id, slideData)
      } else {
        await createHeroSlide(slideData)
      }
      closeForm()
      await loadSlides()
    } catch (error) {
      console.error('Failed to save hero slide:', error.message)
      setActionError('Unable to save this slide. Please try again.')
    }
  }

  async function handleToggleActive(slide) {
    setActionError('')
    try {
      await setHeroSlideActive(slide.id, !slide.isActive)
      await loadSlides()
    } catch (error) {
      console.error('Failed to update slide status:', error.message)
      setActionError('Unable to update this slide. Please try again.')
    }
  }

  function ctaSummary(slide) {
    if (slide.ctaType === 'product') {
      const product = products.find((p) => p.id === slide.productId)
      return `Product: ${product?.name ?? 'Unknown'}`
    }
    return `Route: ${slide.ctaRoute}`
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="mb-0">Home Page — Hero Carousel</h1>
        <button type="button" className="btn btn-brand" onClick={openAddForm}>
          <i className="bi bi-plus-lg me-1"></i> Add Slide
        </button>
      </div>

      {actionError && <div className="alert alert-danger">{actionError}</div>}

      {isLoading ? (
        <div className="text-center text-muted py-5">
          <div className="spinner-border text-secondary" role="status">
            <span className="visually-hidden">Loading…</span>
          </div>
        </div>
      ) : (
        <div className="card-plain p-0">
          <div className="table-responsive">
            <table className="table align-middle mb-0">
              <thead>
                <tr>
                  <th></th>
                  <th>Title</th>
                  <th>CTA</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slides.map((slide) => (
                  <tr key={slide.id}>
                    <td>
                      <img
                        src={slide.imageUrl}
                        alt={slide.title}
                        onError={(event) => {
                          event.currentTarget.onerror = null
                          event.currentTarget.src = fallbackProductImage
                        }}
                        style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                    </td>
                    <td className="fw-semibold">{slide.title}</td>
                    <td className="small text-muted">{ctaSummary(slide)}</td>
                    <td>{slide.displayOrder}</td>
                    <td>
                      <StatusBadge status={slide.isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => openEditForm(slide)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${slide.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => handleToggleActive(slide)}
                        >
                          {slide.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {slides.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-muted py-4">
                      No hero slides yet — add one to populate the Home page carousel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <Modal title={editingSlide ? 'Edit Slide' : 'Add Slide'} onClose={closeForm}>
          <HeroSlideForm
            initialSlide={editingSlide}
            products={products}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </div>
  )
}

export default AdminHomePage
