import React, { useState } from 'react'
import { FiPlus, FiMinus } from 'react-icons/fi'
import Button from '../common/Button'

const MenuItem = ({ item, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {item.image && (
        <img src={item.image} alt={item.name} className="w-full h-40 object-cover" />
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
          {!item.isAvailable ? (
            <span className="text-sm text-red-500">Out of Stock</span>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                >
                  <FiMinus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 hover:bg-gray-200 rounded-lg"
                >
                  <FiPlus className="h-3 w-3" />
                </button>
              </div>
              <Button size="sm" onClick={() => onAddToCart(item, quantity)}>
                Add
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MenuItem