// Resolves a stored cart line (added-time snapshot: productId, variantId,
// price, quantity, ...) against the CURRENT product/variant from the
// centralized ProductContext. Used by Cart and Checkout so both show the
// same live price/availability — CartContext's own stored snapshot is
// only used as a fallback display value once a line becomes unavailable.
export function resolveCartLine(item, getProductById) {
  const product = getProductById(item.productId)
  const variant = product?.variants.find((candidate) => candidate.id === item.variantId)
  const isAvailable = Boolean(
    product && product.isActive && variant && variant.isActive && variant.stock > 0
  )

  return {
    item,
    currentPrice: isAvailable ? variant.price : item.price,
    isAvailable,
    stock: isAvailable ? variant.stock : 0,
  }
}

export function resolveCartLines(items, getProductById) {
  return items.map((item) => resolveCartLine(item, getProductById))
}
