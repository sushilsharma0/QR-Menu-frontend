import React from 'react'
import { Navigate } from 'react-router-dom'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

/** Default restaurant portal landing — KYC first when not verified. */
export default function RestaurantPortalIndex() {
  const { kycLocked } = usePlanAccess()
  const { restaurantBase } = useTenantRoutes()
  return <Navigate to={`${restaurantBase}/${kycLocked ? 'kyc' : 'dashboard'}`} replace />
}
