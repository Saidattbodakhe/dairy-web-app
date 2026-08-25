import { createContext, useContext, useEffect, useState } from 'react'
import * as productService from '../services/productService'

// The ONE source of truth for product data — Supabase-backed. Every
// page that shows or edits products (Home, Products, Product Details,
// Cart pricing, Checkout, Admin Products) reads from this same
// Context; nobody keeps a separate copy, and there is no mock/
// localStorage fallback if Supabase is unreachable — isLoading/error
// are exposed so consumers can show a proper state instead of
// silently pretending the catalog is empty.
const ProductContext = createContext(null)

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadProducts() {
      try {
        const data = await productService.fetchProducts()
        if (isMounted) {
          setProducts(data)
          setError(null)
        }
      } catch (err) {
        console.error('Failed to load products:', err.message)
        if (isMounted) setError('Unable to load products right now. Please try again later.')
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadProducts()

    return () => {
      isMounted = false
    }
  }, [])

  // Used after any admin mutation (add/update/toggle) to bring every
  // consumer back in sync with the database — not tied to the mount
  // effect above, so it's safe to call from an event handler.
  async function refreshProducts() {
    try {
      const data = await productService.fetchProducts()
      setProducts(data)
      setError(null)
    } catch (err) {
      console.error('Failed to refresh products:', err.message)
      setError('Unable to load products right now. Please try again later.')
    }
  }

  function getProductById(id) {
    return products.find((product) => product.id === id)
  }

  function getProductByName(name) {
    return products.find((product) => product.name === name)
  }

  // Admin "add" — inserts into Supabase, then refetches so every
  // consumer sees the new product immediately.
  async function addProduct(productData) {
    await productService.createProduct(productData)
    await refreshProducts()
  }

  // Admin "edit" — merges changes (name/description/category/image/
  // isActive/variants) into the existing product, then refetches.
  async function updateProduct(productId, productData) {
    await productService.updateProduct(productId, productData)
    await refreshProducts()
  }

  // Soft deactivate/reactivate — the row is never deleted, just
  // flipped inactive, so Admin can still see and restore it while
  // customers stop being able to purchase it.
  async function toggleProductActive(productId) {
    const product = getProductById(productId)
    if (!product) return
    await productService.setProductActive(productId, !product.isActive)
    await refreshProducts()
  }

  const value = {
    products,
    isLoading,
    error,
    getProductById,
    getProductByName,
    addProduct,
    updateProduct,
    toggleProductActive,
    refreshProducts,
  }

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const context = useContext(ProductContext)
  if (!context) {
    throw new Error('useProducts must be used inside a ProductProvider')
  }
  return context
}
