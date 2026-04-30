import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FiShoppingCart, FiPlus, FiMinus } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import { useCart } from '../../hooks/useCart'

const Menu = () => {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addToCart, getItemCount } = useCart()
  const [restaurant, setRestaurant] = useState(null)
  const [menu, setMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [quantities, setQuantities] = useState({})

  useEffect(() => {
    fetchMenu()
  }, [slug])

  const fetchMenu = async () => {
    try {
      setLoading(true)
      const response = await api.get(`/restaurant/menu/public/${slug}`)
      setRestaurant(response.data.data.restaurant)
      setMenu(response.data.data.menu)
    } catch (error) {
      toast.error('Failed to load menu')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = (itemId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + delta)
    }))
  }

  const handleAddToCart = (item) => {
    const quantity = quantities[item._id] || 1
    if (quantity > 0) {
      addToCart({ ...item, quantity, restaurantId: restaurant?.id })
      setQuantities(prev => ({ ...prev, [item._id]: 0 }))
      toast.success(`${quantity}x ${item.name} added to cart`)
    }
  }

  const categories = ['all', ...menu.map(c => c.name)]

  const filteredMenu = selectedCategory === 'all' 
    ? menu 
    : menu.filter(c => c.name === selectedCategory)

  const cartItemCount = getItemCount()

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{restaurant?.name}</h1>
            <p className="text-sm text-gray-500">{restaurant?.description}</p>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="relative p-2 text-gray-600 hover:text-primary-600 transition-colors"
          >
            <FiShoppingCart className="h-6 w-6" />
            {cartItemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Category Tabs */}
      <div className="bg-white border-b sticky top-[73px] z-10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 py-3">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'All Items' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {filteredMenu.map((category) => (
          <div key={category._id} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{category.name}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.items.map((item) => (
                <div key={item._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {item.image && (
                    <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  )}
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                        )}
                      </div>
                      {item.isVegetarian && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Veg</span>
                      )}
                    </div>
                    <div className="mt-3 flex justify-between items-center">
                      <div>
                        <span className="text-lg font-bold text-primary-600">${item.price}</span>
                        {item.originalPrice && (
                          <span className="text-sm text-gray-400 line-through ml-2">${item.originalPrice}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!item.isAvailable ? (
                          <span className="text-sm text-red-500">Out of Stock</span>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                              <button
                                onClick={() => updateQuantity(item._id, -1)}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                                disabled={(quantities[item._id] || 0) <= 0}
                              >
                                <FiMinus className="h-4 w-4 text-gray-600" />
                              </button>
                              <span className="w-8 text-center text-gray-900">
                                {quantities[item._id] || 0}
                              </span>
                              <button
                                onClick={() => updateQuantity(item._id, 1)}
                                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                              >
                                <FiPlus className="h-4 w-4 text-gray-600" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleAddToCart(item)}
                              className="bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
                              disabled={(quantities[item._id] || 0) === 0}
                            >
                              Add
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}

export default Menu