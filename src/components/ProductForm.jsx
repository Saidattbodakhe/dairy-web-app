import { useState } from 'react'

function makeEmptyVariant() {
  return {
    id: `variant-${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    quantityValue: '',
    unit: 'ml',
    price: '',
    stock: '',
    minOrderQty: 1,
    maxOrderQty: '',
    isActive: true,
  }
}

// Used for both "Add Product" and "Edit Product" — pass an existing
// product as initialProduct to edit it, or leave it out to start blank.
function ProductForm({ initialProduct, onSave, onCancel }) {
  const [name, setName] = useState(initialProduct?.name ?? '')
  const [description, setDescription] = useState(initialProduct?.description ?? '')
  const [category, setCategory] = useState(initialProduct?.category ?? '')
  const [image, setImage] = useState(initialProduct?.image ?? '')
  const [isActive, setIsActive] = useState(initialProduct?.isActive ?? true)
  const [variants, setVariants] = useState(
    initialProduct?.variants?.length
      ? initialProduct.variants.map((variant) => ({ ...variant }))
      : [makeEmptyVariant()]
  )
  const [error, setError] = useState('')

  function updateVariant(index, field, value) {
    setVariants((current) =>
      current.map((variant, i) => (i === index ? { ...variant, [field]: value } : variant))
    )
  }

  function addVariantRow() {
    setVariants((current) => [...current, makeEmptyVariant()])
  }

  function removeVariantRow(index) {
    setVariants((current) => current.filter((_, i) => i !== index))
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) return setError('Product name is required.')
    if (!category.trim()) return setError('Category is required.')
    if (variants.length === 0) return setError('Add at least one variant.')
    if (variants.some((variant) => !variant.name.trim())) {
      return setError('Every variant needs a name.')
    }

    setError('')

    const cleanedVariants = variants.map((variant) => ({
      ...variant,
      name: variant.name.trim(),
      quantityValue: Number(variant.quantityValue) || 0,
      price: Number(variant.price) || 0,
      stock: Number(variant.stock) || 0,
      minOrderQty: Number(variant.minOrderQty) || 1,
      maxOrderQty: variant.maxOrderQty ? Number(variant.maxOrderQty) : null,
    }))

    onSave({
      name: name.trim(),
      description: description.trim(),
      shortDescription: description.trim().slice(0, 60),
      category: category.trim(),
      image: image.trim() || initialProduct?.image || '',
      isActive,
      variants: cleanedVariants,
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label" htmlFor="productName">Name</label>
        <input
          id="productName"
          type="text"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="mb-3">
        <label className="form-label" htmlFor="productDescription">Description</label>
        <textarea
          id="productDescription"
          className="form-control"
          rows="2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="row g-3 mb-3">
        <div className="col-12 col-sm-6">
          <label className="form-label" htmlFor="productCategory">Category</label>
          <input
            id="productCategory"
            type="text"
            className="form-control"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="col-12 col-sm-6">
          <label className="form-label" htmlFor="productImage">Image URL (demo)</label>
          <input
            id="productImage"
            type="text"
            className="form-control"
            placeholder="Leave blank to keep placeholder"
            value={image}
            onChange={(e) => setImage(e.target.value)}
          />
        </div>
      </div>

      <div className="form-check form-switch mb-4">
        <input
          className="form-check-input"
          type="checkbox"
          role="switch"
          id="productActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        <label className="form-check-label" htmlFor="productActive">Active</label>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h3 className="h6 mb-0">Variants</h3>
        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addVariantRow}>
          <i className="bi bi-plus-lg me-1"></i> Add Variant
        </button>
      </div>

      {variants.map((variant, index) => (
        <div className="border rounded-3 p-3 mb-2" key={variant.id}>
          <div className="row g-2 mb-2">
            <div className="col-12 col-sm-6">
              <input
                type="text"
                className="form-control form-control-sm"
                placeholder="Variant name (e.g. 1 litre)"
                value={variant.name}
                onChange={(e) => updateVariant(index, 'name', e.target.value)}
              />
            </div>
            <div className="col-3">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Qty"
                value={variant.quantityValue}
                onChange={(e) => updateVariant(index, 'quantityValue', e.target.value)}
              />
            </div>
            <div className="col-3">
              <select
                className="form-select form-select-sm"
                value={variant.unit}
                onChange={(e) => updateVariant(index, 'unit', e.target.value)}
              >
                <option value="ml">ml</option>
                <option value="litre">litre</option>
                <option value="g">g</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          <div className="row g-2 mb-2">
            <div className="col-3">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Price"
                value={variant.price}
                onChange={(e) => updateVariant(index, 'price', e.target.value)}
              />
            </div>
            <div className="col-3">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Stock"
                value={variant.stock}
                onChange={(e) => updateVariant(index, 'stock', e.target.value)}
              />
            </div>
            <div className="col-3">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Min Qty"
                value={variant.minOrderQty}
                onChange={(e) => updateVariant(index, 'minOrderQty', e.target.value)}
              />
            </div>
            <div className="col-3">
              <input
                type="number"
                className="form-control form-control-sm"
                placeholder="Max Qty"
                value={variant.maxOrderQty ?? ''}
                onChange={(e) => updateVariant(index, 'maxOrderQty', e.target.value)}
              />
            </div>
          </div>

          <div className="text-end">
            <button
              type="button"
              className="btn btn-link text-danger btn-sm p-0"
              onClick={() => removeVariantRow(index)}
              disabled={variants.length === 1}
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {error && <div className="text-danger small mt-2 mb-3">{error}</div>}

      <div className="d-flex gap-2 mt-4">
        <button type="submit" className="btn btn-brand flex-grow-1">Save Product</button>
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  )
}

export default ProductForm
