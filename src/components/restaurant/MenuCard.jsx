import React from 'react'
import { FiEdit2, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi'
import Card from '../common/Card'

const MenuCard = ({ item, onEdit, onDelete, onToggleAvailability }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        {item.image && (
          <img src={item.image} alt={item.name} className="w-20 h-20 rounded-lg object-cover" />
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-gray-900">{item.name}</h3>
              <p className="text-sm text-gray-500">{item.category?.name}</p>
            </div>
            <span className="text-lg font-bold text-primary-600">${item.price}</span>
          </div>
          {item.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
          )}
          <div className="flex gap-2 mt-3">
            <button onClick={() => onEdit(item)} className="p-1 text-gray-400 hover:text-blue-600">
              <FiEdit2 className="h-4 w-4" />
            </button>
            <button onClick={() => onToggleAvailability(item)} className="p-1 text-gray-400 hover:text-yellow-600">
              {item.isAvailable ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
            </button>
            <button onClick={() => onDelete(item)} className="p-1 text-gray-400 hover:text-red-600">
              <FiTrash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  )
}

export default MenuCard