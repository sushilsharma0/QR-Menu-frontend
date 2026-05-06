import React from 'react'
import { FiTrash2, FiPlus, FiMinus } from 'react-icons/fi'

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const currency = item?.currency || 'Rs.'
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{item.name}</h4>
        <p className="text-sm text-gray-500">{currency}{item.price}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg">
          <button
            onClick={() => onUpdateQuantity(item._id, item.quantity - 1)}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <FiMinus className="h-3 w-3" />
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(item._id, item.quantity + 1)}
            className="p-2 hover:bg-gray-200 rounded-lg"
          >
            <FiPlus className="h-3 w-3" />
          </button>
        </div>
        <button onClick={() => onRemove(item._id)} className="p-2 text-gray-400 hover:text-red-500">
          <FiTrash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export default CartItem