import { useState } from 'react'
import { uploadHeroSlideImage } from '../services/heroSlideService'
import { fallbackProductImage } from '../data/mockProducts'

// Used for both "Add Slide" and "Edit Slide" — mirrors ProductForm.jsx's
// structure/visual language so Admin Home Page feels native to the
// rest of Admin Products rather than a separate design.
function HeroSlideForm({ initialSlide, products, onSave, onCancel }) {
  const [draftSlideId] = useState(() => initialSlide?.id || crypto.randomUUID())
  const [title, setTitle] = useState(initialSlide?.title ?? '')
  const [description, setDescription] = useState(initialSlide?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initialSlide?.imageUrl ?? '')
  const [ctaText, setCtaText] = useState(initialSlide?.ctaText ?? '')
  const [ctaType, setCtaType] = useState(initialSlide?.ctaType ?? 'route')
  const [ctaRoute, setCtaRoute] = useState(initialSlide?.ctaRoute ?? '/products')
  const [productId, setProductId] = useState(initialSlide?.productId ?? products?.[0]?.id ?? '')
  const [isActive, setIsActive] = useState(initialSlide?.isActive ?? true)
  const [displayOrder, setDisplayOrder] = useState(initialSlide?.displayOrder ?? 0)
  const [error, setError] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)

  async function handleImageChange(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    setError('')
    try {
      const publicUrl = await uploadHeroSlideImage(draftSlideId, file)
      setImageUrl(publicUrl)
    } catch (uploadError) {
      console.error('Hero slide image upload failed:', uploadError.message)
      setError('Image upload failed. Please try a different image.')
    } finally {
      setIsUploadingImage(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!title.trim()) return setError('Title is required.')
    if (!imageUrl.trim()) return setError('An image is required.')
    if (ctaType === 'route' && !ctaRoute.trim()) return setError('CTA destination is required.')
    if (ctaType === 'product' && !productId) return setError('Choose a product to link to.')

    setError('')

    onSave({
      id: draftSlideId,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl.trim(),
      ctaText: ctaText.trim(),
      ctaType,
      ctaRoute: ctaType === 'route' ? ctaRoute.trim() : null,
      productId: ctaType === 'product' ? productId : null,
      isActive,
      displayOrder: Number(displayOrder) || 0,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label" htmlFor="slideTitle">Title</label>
        <input
          id="slideTitle"
          type="text"
          className="form-control"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="slideDescription">Description</label>
        <textarea
          id="slideDescription"
          className="form-control"
          rows="2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="slideImage">Slide Image</label>
        <div className="d-flex align-items-center gap-2 mb-2">
          <img
            src={imageUrl || fallbackProductImage}
            alt=""
            onError={(event) => {
              event.currentTarget.onerror = null
              event.currentTarget.src = fallbackProductImage
            }}
            style={{ width: '64px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
          />
          <input
            id="slideImage"
            type="file"
            accept="image/*"
            className="form-control form-control-sm"
            onChange={handleImageChange}
            disabled={isUploadingImage}
          />
        </div>
        {isUploadingImage && <div className="text-muted small">Uploading…</div>}
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6">
          <label className="form-label" htmlFor="slideCtaText">CTA Text</label>
          <input
            id="slideCtaText"
            type="text"
            className="form-control"
            placeholder="e.g. ORDER MILK"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
          />
        </div>
        <div className="col-12 col-sm-6">
          <label className="form-label" htmlFor="slideCtaType">CTA Type</label>
          <select
            id="slideCtaType"
            className="form-select"
            value={ctaType}
            onChange={(e) => setCtaType(e.target.value)}
          >
            <option value="route">Page / Route</option>
            <option value="product">Specific Product</option>
          </select>
        </div>
      </div>

      {ctaType === 'route' ? (
        <div className="mb-3">
          <label className="form-label" htmlFor="slideCtaRoute">Destination (e.g. /products)</label>
          <input
            id="slideCtaRoute"
            type="text"
            className="form-control"
            value={ctaRoute}
            onChange={(e) => setCtaRoute(e.target.value)}
          />
        </div>
      ) : (
        <div className="mb-3">
          <label className="form-label" htmlFor="slideProduct">Linked Product</label>
          <select
            id="slideProduct"
            className="form-select"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            {(products ?? []).map((product) => (
              <option key={product.id} value={product.id}>{product.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6">
          <label className="form-label" htmlFor="slideOrder">Display Order</label>
          <input
            id="slideOrder"
            type="number"
            className="form-control"
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />
        </div>
        <div className="col-12 col-sm-6 d-flex align-items-end">
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="slideActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="slideActive">Active</label>
          </div>
        </div>
      </div>

      {imageUrl && (
        <div className="mb-3">
          <div className="fw-semibold small mb-2">Preview</div>
          <div className="border rounded-3 p-3 d-flex align-items-center gap-3">
            <img
              src={imageUrl}
              alt=""
              onError={(event) => {
                event.currentTarget.onerror = null
                event.currentTarget.src = fallbackProductImage
              }}
              style={{ width: '96px', height: '60px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
            />
            <div>
              <div className="fw-bold">{title || 'Slide title'}</div>
              <div className="text-muted small">{description || 'Slide description'}</div>
              {ctaText && <span className="btn btn-accent btn-sm mt-1">{ctaText}</span>}
            </div>
          </div>
        </div>
      )}

      {error && <div className="text-danger small mt-2 mb-3">{error}</div>}

      <div className="d-flex gap-2 mt-4">
        <button type="submit" className="btn btn-brand flex-grow-1" disabled={isUploadingImage}>
          Save Slide
        </button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export default HeroSlideForm
