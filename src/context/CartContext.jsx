import { createContext, useContext, useState, useEffect } from 'react'
import { effectivePrice } from '../lib/supabase'

const CartContext = createContext({})
const CART_KEY   = 'shopease_cart'

export function CartProvider({ children }) {
  const [items,  setItems]  = useState([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CART_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  }, [items])

  function addToCart(product, qty = 1) {
    setItems(prev => {
      const exists = prev.find(i => i.product.id === product.id)
      if (exists) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(i.quantity + qty, product.stock || 99) }
            : i
        )
      }
      return [...prev, { product, quantity: qty }]
    })
  }

  function removeFromCart(productId) {
    setItems(prev => prev.filter(i => i.product.id !== productId))
  }

  function updateQty(productId, qty) {
    if (qty < 1) { removeFromCart(productId); return }
    setItems(prev => prev.map(i =>
      i.product.id === productId ? { ...i, quantity: qty } : i
    ))
  }

  function clearCart() { setItems([]) }

  const totalItems = items.reduce((s, i) => s + i.quantity, 0)
  const totalPrice = items.reduce((s, i) => s + effectivePrice(i.product) * i.quantity, 0)

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQty, clearCart,
      totalItems, totalPrice, isOpen, setIsOpen,
    }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
