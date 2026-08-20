import { createContext, useContext, useEffect, useState } from 'react'

const CART_STORAGE_KEY = 'dairy_cart'
const CartContext = createContext(null)

function loadCartFromStorage() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// React Context lets any component in the app read/update the cart
// without passing it down as a prop through every parent component
// ("prop drilling"). CartProvider holds the actual cart state; any page
// that needs it calls the useCart() hook below.
export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCartFromStorage)

  // useEffect runs after render, whenever `items` changes. Saving to
  // localStorage here means the cart survives a page refresh.
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items])

  function isSameLine(item, productId, variantId) {
    return item.productId === productId && item.variantId === variantId
  }

  function addItem(product, variant, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => isSameLine(item, product.id, variant.id))

      if (existing) {
        return current.map((item) =>
          isSameLine(item, product.id, variant.id)
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }

      return [
        ...current,
        {
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          image: product.image,
          price: variant.price,
          quantity,
        },
      ]
    })
  }

  function increaseQuantity(productId, variantId) {
    setItems((current) =>
      current.map((item) =>
        isSameLine(item, productId, variantId) ? { ...item, quantity: item.quantity + 1 } : item
      )
    )
  }

  function decreaseQuantity(productId, variantId) {
    setItems((current) =>
      current
        .map((item) =>
          isSameLine(item, productId, variantId) ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  function removeItem(productId, variantId) {
    setItems((current) => current.filter((item) => !isSameLine(item, productId, variantId)))
  }

  function clearCart() {
    setItems([])
  }

  const cartCount = items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0)

  const value = {
    items,
    addItem,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
    cartCount,
    subtotal,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// Any component calls useCart() to read the cart or trigger changes,
// e.g. const { addItem, cartCount } = useCart()
export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider')
  }
  return context
}
