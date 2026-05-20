import React, { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import toast from '@utils/toast'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import {
  featureKeyForPath,
<<<<<<< HEAD
  isPathAllowedBeforeKyc,
} from '../../constants/planFeatureMap'

/**
 * Blocks restaurant routes until KYC is approved and plan features allow access.
 * Disabled plan modules: hidden in sidebar + silent redirect (no error toast).
 */
export default function PlanProtectedOutlet() {
  const location = useLocation()
  const { isFeatureEnabled, kycLocked } = usePlanAccess()
  const { restaurantBase } = useTenantRoutes()
  const featureKey = featureKeyForPath(location.pathname)
  const kycToastShown = useRef(false)

  const kycBlocked = kycLocked && !isPathAllowedBeforeKyc(location.pathname)
  const planBlocked = Boolean(featureKey && !isFeatureEnabled(featureKey))

  useEffect(() => {
    if (kycBlocked && !kycToastShown.current) {
      kycToastShown.current = true
      toast('Verify your KYC to unlock menu, POS, orders, and all sidebar features.', {
        duration: 7000,
      })
    }
    if (!kycBlocked) {
      kycToastShown.current = false
    }
  }, [kycBlocked, location.pathname])

  if (kycBlocked) {
    return <Navigate to={`${restaurantBase}/kyc`} replace />
  }
=======
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
>>>>>>> 7b607cb6b43ad3bc5c94ad4ec80d0751a9126c01

  if (planBlocked) {
    return <Navigate to={`${restaurantBase}/dashboard`} replace />
  }

  return <Outlet />
}
