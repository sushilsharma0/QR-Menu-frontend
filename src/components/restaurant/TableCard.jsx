import React from 'react'
import { FiQrCode, FiEdit2, FiTrash2, FiRefreshCw } from 'react-icons/fi'
import Card from '../common/Card'

const TableCard = ({ table, onViewQR, onEdit, onDelete, onRegenerateQR }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Table {table.tableNumber}</h3>
          <p className="text-sm text-gray-500">Capacity: {table.capacity} persons</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full ${table.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {table.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onViewQR(table)} className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 flex items-center justify-center gap-1">
          <FiQrCode /> QR Code
        </button>
        <button onClick={() => onRegenerateQR(table)} className="p-2 text-gray-500 hover:text-blue-600" title="Regenerate QR">
          <FiRefreshCw />
        </button>
        <button onClick={() => onEdit(table)} className="p-2 text-gray-500 hover:text-green-600" title="Edit">
          <FiEdit2 />
        </button>
        <button onClick={() => onDelete(table)} className="p-2 text-gray-500 hover:text-red-600" title="Delete">
          <FiTrash2 />
        </button>
      </div>
    </Card>
  )
}

export default TableCard