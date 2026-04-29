import React from 'react'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'

const CategoryCard = ({ category, onEdit, onDelete }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{category.name}</h3>
          {category.description && (
            <p className="text-sm text-gray-500 mt-1">{category.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">Sort Order: {category.sortOrder}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(category)} className="p-1 text-gray-400 hover:text-blue-600">
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(category)} className="p-1 text-gray-400 hover:text-red-600">
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default CategoryCard