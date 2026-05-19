import React, { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import toast from '@utils/toast'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import {
  featureKeyForPath,
  PLAN_FEATURE_LABELS,
} from '../../constants/planFeatureMap'

/**
 * Blocks restaurant routes only when the effective plan/trial feature flags disallow access.
 * KYC is a reminder/compliance workflow and does not lock routes by itself.
 */
export default function PlanProtectedOutlet() {
  const location = useLocation()
  const { isFeatureEnabled } = usePlanAccess()
  const { restaurantBase } = useTenantRoutes()
  const featureKey = featureKeyForPath(location.pathname)

  useEffect(() => {
    if (featureKey && !isFeatureEnabled(featureKey)) {
      toast.error(`${PLAN_FEATURE_LABELS[featureKey] || 'This feature'} is not included in your subscription plan.`)
    }
  }, [featureKey, isFeatureEnabled, location.pathname])

  if (featureKey && !isFeatureEnabled(featureKey)) {
    return <Navigate to={`${restaurantBase}/subscription`} replace />
  }

  return <Outlet />
}
