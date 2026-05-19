import React, { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import toast from '@utils/toast'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { featureKeyForPath, PLAN_FEATURE_LABELS } from '../../constants/planFeatureMap'

/**
 * Blocks restaurant routes for features disabled on the current subscription plan.
 * KYC, subscription, and security paths are always allowed.
 */
export default function PlanProtectedOutlet() {
  const location = useLocation()
  const { isFeatureEnabled, toastLocked } = usePlanAccess()
  const { restaurantBase } = useTenantRoutes()
  const featureKey = featureKeyForPath(location.pathname)

  useEffect(() => {
    if (featureKey && !isFeatureEnabled(featureKey)) {
      toast.error(`${PLAN_FEATURE_LABELS[featureKey] || 'This feature'} is not included in your subscription plan.`)
    }
  }, [featureKey, isFeatureEnabled, toastLocked, location.pathname])

  if (featureKey && !isFeatureEnabled(featureKey)) {
    return <Navigate to={`${restaurantBase}/subscription`} replace />
  }

  return <Outlet />
}
