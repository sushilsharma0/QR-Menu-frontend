import React from 'react'

const OrderStatusBadge = ({ status }) => {
  const config = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
    preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
    ready: { label: 'Ready', color: 'bg-green-100 text-green-800' },
    served: { label: 'Served', color: 'bg-gray-100 text-gray-800' },
    cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  }

  const { label, color } = config[status] || config.pending

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${color}`}>
      {label}
    </span>
  )
}

export default OrderStatusBadge