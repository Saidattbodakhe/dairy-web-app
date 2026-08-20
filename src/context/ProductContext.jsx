import { createContext, useContext, useEffect, useState } from 'react'
import { mockProducts as defaultProducts } from '../data/mockProducts'

// The ONE source of truth for product data. Every page that shows or
// edits products (Home, Products, Product Details, Cart pricing,
// Checkout, Admin Products) reads from this same Context — nobody
// keeps a separate copy. Admin edits update this state immediately
// (so customer pages re-render with no refresh needed) and persist to
// localStorage, seeded from mockProducts.js the first time it runs.
const PRODUCTS_STORAGE_KEY = 'mockProductsState'
const ProductContext = createContext(null)

function loadInitialProducts() {
  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through to defaults below
  }
  return defaultProducts
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(loadInitialProducts)

  useEffect(() => {
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products))
  }, [products])

  function getProductById(id) {
    return products.find((product) => product.id === id)
  }

  function getProductByName(name) {
    return products.find((product) => product.name === name)
  }

  function addProduct(productData) {
    setProducts((current) => {
      const newProduct = { ...productData, id: `custom-${current.length + 1}` }
      return [...current, newProduct]
    })
  }

  // Admin "edit" — merges changes into the existing product (name,
  // description, category, image, isActive, variants, etc.) without
  // touching its id, so every existing reference (cart lines, past
  // orders, routes) still resolves to the same product.
  function updateProduct(productId, productData) {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, ...productData, id: product.id } : product
      )
    )
  }

  // Soft deactivate/reactivate — the product object is never deleted,
  // just flipped inactive, so Admin can still see and restore it while
  // customers stop being able to purchase it.
  function toggleProductActive(productId) {
    setProducts((current) =>
      current.map((product) =>
        product.id === productId ? { ...product, isActive: !product.isActive } : product
      )
    )
  }

  const value = {
    products,
    getProductById,
    getProductByName,
    addProduct,
    updateProduct,
    toggleProductActive,
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
