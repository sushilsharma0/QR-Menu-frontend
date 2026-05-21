import React, { useEffect, useState } from 'react'
import { FiEdit2, FiTrash2, FiKey } from 'react-icons/fi'
import Card from '../common/Card'
import Badge from '../common/Badge'

const EmployeeCard = ({ employee, onEdit, onDelete, onResetPassword }) => {
  const [lastLoginLabel, setLastLoginLabel] = useState('Never')
  const roleColors = {
    admin: 'purple',
    manager: 'blue',
    kitchen: 'yellow',
    cashier: 'green',
    waiter: 'indigo',
  }

  useEffect(() => {
    setLastLoginLabel(employee.lastLogin ? new Date(employee.lastLogin).toLocaleDateString() : 'Never')
  }, [employee.lastLogin])

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{employee.name}</h3>
          <p className="text-sm text-gray-500">@{employee.username}</p>
          <p className="text-sm text-gray-500">{employee.email}</p>
          <div className="mt-2">
            <Badge variant={roleColors[employee.role] || 'default'}>{employee.role}</Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onResetPassword(employee)} className="p-1 text-gray-400 hover:text-yellow-600" title="Reset Password">
            <FiKey className="h-4 w-4" />
          </button>
          <button onClick={() => onEdit(employee)} className="p-1 text-gray-400 hover:text-blue-600" title="Edit">
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(employee)} className="p-1 text-gray-400 hover:text-red-600" title="Delete">
            <FiTrash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t">
        <p className="text-xs text-gray-400">Last Login: {lastLoginLabel}</p>
      </div>
    </Card>
  )
}

export default EmployeeCard
