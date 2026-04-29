import React from 'react'
import { useNavigate } from 'react-router-dom'
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi'
import { useCart } from '../../hooks/useCart'
import Button from '../../components/common/Button'

const Cart = () => {
  const navigate = useNavigate()
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart()

  if (!cart.items.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-4">Add items from the menu to get started</p>
          <Button onClick={() => navigate(-1)}>Browse Menu</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

        <div className="bg-white rounded-xl shadow-sm mb-6">
          {cart.items.map((item) => (
            <div key={item._id} className="flex items-center justify-between p-4 border-b last:border-0">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-500">${item.price}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity - 1)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiMinus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item._id, item.quantity + 1)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <FiPlus className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-medium">${cart.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4">
            <span className="text-gray-600">Tax (13%)</span>
            <span className="font-medium">${(cart.total * 0.13).toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-t pt-4 mb-6">
            <span className="text-lg font-bold">Total</span>
            <span className="text-xl font-bold text-primary-600">${(cart.total * 1.13).toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => navigate(-1)} className="flex-1">
              Continue Shopping
            </Button>
            <Button onClick={() => navigate('/checkout')} className="flex-1">
              Proceed to Checkout
            </Button>
          </div>
          <button onClick={clearCart} className="text-sm text-red-500 mt-4 w-full text-center">
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  )
}

export default Cart