import React, { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import toast from '@utils/toast'
import { usePlanAccess } from '../../hooks/usePlanAccess'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import {
  featureKeyForPath,
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

  if (planBlocked) {
    return <Navigate to={`${restaurantBase}/dashboard`} replace />
  }

  return <Outlet />
}
