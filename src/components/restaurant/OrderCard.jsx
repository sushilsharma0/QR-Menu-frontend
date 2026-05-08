import React from 'react'
import { FiEye } from 'react-icons/fi'
import Card from '../common/Card'
import Button from '../common/Button'
import OrderStatusBadge from './OrderStatusBadge'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

const OrderCard = ({ order, onView, onStatusUpdate }) => {
  const name = String(order?.customerName || '').trim()
  const customerLabel =
    order?.guestId && (!name || name.toLowerCase() === 'guest' || name.toLowerCase() === 'qr customer')
      ? order.guestId
      : name || order?.guestId || 'Guest'

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
          <p className="text-sm text-gray-500">Table: {order.table?.tableNumber}</p>
          <p className="text-sm text-gray-500">{customerLabel}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>
      <div className="mb-3">
        <p className="text-sm text-gray-600">
          {order.items?.length} items • {DEFAULT_CURRENCY_SYMBOL}{Number(order.grandTotal).toFixed(2)}
        </p>
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => onView(order)}>
          <FiEye className="mr-1" /> View
        </Button>
        {order.status === 'pending' && (
          <Button size="sm" onClick={() => onStatusUpdate(order, 'confirmed')}>Confirm</Button>
        )}
        {order.status === 'confirmed' && (
          <Button size="sm" onClick={() => onStatusUpdate(order, 'preparing')}>Start</Button>
        )}
        {order.status === 'preparing' && (
          <Button size="sm" variant="success" onClick={() => onStatusUpdate(order, 'ready')}>Ready</Button>
        )}
      </div>
    </Card>
  )
}

export default OrderCard
