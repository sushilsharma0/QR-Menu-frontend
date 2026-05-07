import React from 'react'
import { RestaurantStatusPill, orderStatusStyles } from './RestaurantUI'

const OrderStatusBadge = ({ status }) => {
  return <RestaurantStatusPill value={status || 'pending'} styles={orderStatusStyles} />
}

export default OrderStatusBadge
