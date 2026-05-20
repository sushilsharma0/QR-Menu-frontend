import React from 'react'
import { Navigate } from 'react-router-dom'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

/** Default restaurant portal landing. */
export default function RestaurantPortalIndex() {
  const { restaurantBase } = useTenantRoutes()
  return <Navigate to={`${restaurantBase}/dashboard`} replace />
}
