import React, { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import toast from '@utils/toast'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import {
  featureKeyForPath,
  isPathAllowedBeforeKyc,
  PLAN_FEATURE_LABELS,
} from '../../constants/planFeatureMap'

/**
 * Blocks restaurant routes when KYC is pending (except setup paths) or when
 * plan/trial feature flags disallow access.
 */
export default function PlanProtectedOutlet() {
  const routerLocation = useLocation()
  const { isFeatureEnabled, kycLocked } = usePlanAccess()
  const { restaurantBase } = useTenantRoutes()
  const featureKey = featureKeyForPath(routerLocation.pathname)
  const kycToastShown = useRef(false)
  const planToastShown = useRef(false)

  const kycBlocked = kycLocked && !isPathAllowedBeforeKyc(routerLocation.pathname)
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
  }, [kycBlocked, routerLocation.pathname])

  useEffect(() => {
    if (planBlocked && featureKey && !planToastShown.current) {
      planToastShown.current = true
      toast.error(
        `${PLAN_FEATURE_LABELS[featureKey] || 'This feature'} is not included in your subscription plan.`,
      )
    }
    if (!planBlocked) {
      planToastShown.current = false
    }
  }, [planBlocked, featureKey, routerLocation.pathname])

  if (kycBlocked) {
    return <Navigate to={`${restaurantBase}/kyc`} replace />
  }

  if (planBlocked) {
    return <Navigate to={`${restaurantBase}/dashboard`} replace />
  }

  return <Outlet />
}
