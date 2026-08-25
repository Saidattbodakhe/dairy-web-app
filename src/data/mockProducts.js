// Products now come from Supabase (see src/services/productService.js
// and src/context/ProductContext.jsx) — this file no longer holds the
// catalog itself. What's left are small, generic, pure helpers that
// operate on any product-shaped object and are still reused across
// the app; kept here rather than moved, to avoid unnecessary churn in
// every file that already imports them from this path.
import fallbackImage from '../assets/products/fallback.svg'

export const fallbackProductImage = fallbackImage

// Shared "Popular" designation, reused by Home's Popular Products
// section and the Products page card badge — one source of truth
// instead of two pages each guessing which products are popular.
export const popularProductNames = ['Cow Milk', 'Curd', 'Paneer', 'Cow Ghee']

export function getStartingPrice(product) {
  const activeVariants = product.variants.filter((variant) => variant.isActive)
  if (activeVariants.length === 0) return null
  return Math.min(...activeVariants.map((variant) => variant.price))
}

export function isProductInStock(product) {
  return product.variants.some((variant) => variant.isActive && variant.stock > 0)
}
