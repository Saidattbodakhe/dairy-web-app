import { Fragment, useEffect, useState } from 'react'
import Modal from '../../components/Modal'
import ProductForm from '../../components/ProductForm'
import StatusBadge from '../../components/StatusBadge'
import { getStartingPrice, fallbackProductImage } from '../../data/mockProducts'
import { useProducts } from '../../context/ProductContext'
import { fetchCategories } from '../../services/productService'

function AdminProducts() {
  const { products, isLoading, addProduct, updateProduct, toggleProductActive } = useProducts()
  const [categories, setCategories] = useState([])
  const [editingProduct, setEditingProduct] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [expandedProductId, setExpandedProductId] = useState(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetchCategories()
      .then(setCategories)
      .catch((error) => console.error('Failed to load categories:', error.message))
  }, [])

  function openAddForm() {
    setEditingProduct(null)
    setShowForm(true)
  }

  function openEditForm(product) {
    setEditingProduct(product)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingProduct(null)
  }

  async function handleSave(productData) {
    setActionError('')
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData)
      } else {
        await addProduct(productData)
      }
      closeForm()
    } catch (error) {
      console.error('Failed to save product:', error.message)
      setActionError('Unable to save this product. Please try again.')
    }
  }

  async function handleToggleActive(productId) {
    setActionError('')
    try {
      await toggleProductActive(productId)
    } catch (error) {
      console.error('Failed to update product status:', error.message)
      setActionError('Unable to update this product. Please try again.')
    }
  }

  function toggleExpanded(productId) {
    setExpandedProductId((current) => (current === productId ? null : productId))
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h1 className="mb-0">Products</h1>
        <button type="button" className="btn btn-brand" onClick={openAddForm}>
          <i className="bi bi-plus-lg me-1"></i> Add Product
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
                <th>Name</th>
                <th>Category</th>
                <th>Starting Price</th>
                <th>Variants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <Fragment key={product.id}>
                  <tr>
                    <td>
                      <img
                        src={product.image}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.onerror = null
                          event.currentTarget.src = fallbackProductImage
                        }}
                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                      />
                    </td>
                    <td className="fw-semibold">{product.name}</td>
                    <td>{product.category}</td>
                    <td>
                      {getStartingPrice(product) !== null ? `₹${getStartingPrice(product)}` : '—'}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0"
                        onClick={() => toggleExpanded(product.id)}
                      >
                        {product.variants.length} variant(s)
                      </button>
                    </td>
                    <td>
                      <StatusBadge status={product.isActive ? 'Active' : 'Inactive'} />
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm"
                          onClick={() => openEditForm(product)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${product.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                          onClick={() => handleToggleActive(product.id)}
                        >
                          {product.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>

                  {expandedProductId === product.id && (
                    <tr>
                      <td colSpan="7" className="bg-light-subtle">
                        <table className="table table-sm mb-0">
                          <thead>
                            <tr>
                              <th>Variant</th>
                              <th>Price</th>
                              <th>Stock</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((variant) => (
                              <tr key={variant.id}>
                                <td>{variant.name}</td>
                                <td>₹{variant.price}</td>
                                <td>{variant.stock}</td>
                                <td>
                                  <StatusBadge status={variant.isActive ? 'Active' : 'Inactive'} />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {showForm && (
        <Modal title={editingProduct ? 'Edit Product' : 'Add Product'} onClose={closeForm}>
          <ProductForm
            initialProduct={editingProduct}
            categories={categories}
            onSave={handleSave}
            onCancel={closeForm}
          />
        </Modal>
      )}
    </div>
  )
}

export default AdminProducts
