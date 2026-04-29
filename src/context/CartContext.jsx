import React, { createContext, useState, useEffect } from 'react'

export const CartContext = createContext()

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart')
    return savedCart ? JSON.parse(savedCart) : { items: [], total: 0, restaurantId: null }
  })

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  const addToCart = (item) => {
    setCart(prev => {
      if (prev.restaurantId && prev.restaurantId !== item.restaurantId) {
        if (!window.confirm('Adding items from a different restaurant will clear your current cart. Continue?')) {
          return prev
        }
        return {
          items: [{ ...item, quantity: item.quantity }],
          total: item.price * item.quantity,
          restaurantId: item.restaurantId
        }
      }

      const existingItem = prev.items.find(i => i._id === item._id)
      let newItems

      if (existingItem) {
        newItems = prev.items.map(i =>
          i._id === item._id ? { ...i, quantity: i.quantity + item.quantity } : i
        )
      } else {
        newItems = [...prev.items, item]
      }

      const newTotal = newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)

      return {
        items: newItems,
        total: newTotal,
        restaurantId: prev.restaurantId || item.restaurantId
      }
    })
  }

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const newItems = prev.items.filter(i => i._id !== itemId)
      const newTotal = newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
      return {
        items: newItems,
        total: newTotal,
        restaurantId: newItems.length === 0 ? null : prev.restaurantId
      }
    })
  }

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    setCart(prev => {
      const newItems = prev.items.map(i =>
        i._id === itemId ? { ...i, quantity } : i
      )
      const newTotal = newItems.reduce((sum, i) => sum + (i.price * i.quantity), 0)
      return { ...prev, items: newItems, total: newTotal }
    })
  }

  const clearCart = () => {
    setCart({ items: [], total: 0, restaurantId: null })
  }

  const getItemCount = () => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0)
  }

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getItemCount
    }}>
      {children}
    </CartContext.Provider>
  )
}