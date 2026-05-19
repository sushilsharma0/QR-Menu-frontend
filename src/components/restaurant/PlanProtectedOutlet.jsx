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
 * Blocks restaurant routes until KYC is approved and plan features allow access.
 * KYC, subscription, and security paths stay open.
 */
export default function PlanProtectedOutlet() {
  const location = useLocation()
  const { isFeatureEnabled, toastLocked, kycLocked } = usePlanAccess()
  const { restaurantBase } = useTenantRoutes()
  const featureKey = featureKeyForPath(location.pathname)
  const kycToastShown = useRef(false)

  const kycBlocked = kycLocked && !isPathAllowedBeforeKyc(location.pathname)

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

  useEffect(() => {
    if (!kycBlocked && featureKey && !isFeatureEnabled(featureKey)) {
      toast.error(`${PLAN_FEATURE_LABELS[featureKey] || 'This feature'} is not included in your subscription plan.`)
    }
  }, [featureKey, isFeatureEnabled, kycBlocked, location.pathname])

  if (kycBlocked) {
    return <Navigate to={`${restaurantBase}/kyc`} replace />
  }

  if (featureKey && !isFeatureEnabled(featureKey)) {
    return <Navigate to={`${restaurantBase}/subscription`} replace />
  }

  return <Outlet />
}
