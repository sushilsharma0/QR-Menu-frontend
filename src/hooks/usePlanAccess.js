import { useMemo } from 'react'
import { useAuth } from './useAuth'
import {
  featureKeyForSegment,
  isNavUnlockedWhenBillingLocked,
  isNavUnlockedWhenKycPending,
  PLAN_FEATURE_LABELS,
} from '../constants/planFeatureMap'

export function usePlanAccess() {
  const { user } = useAuth()

  return useMemo(() => {
    const isRestaurantOwner = user?.role === 'restaurant' && user?.scope !== 'employee'
    const featureFlags = user?.planFeatureFlags || {}
    const kycLocked = isRestaurantOwner && user?.isKYCVerified !== true
    const billingLocked = isRestaurantOwner && user?.needsPlanUpgrade === true && !kycLocked
    const isPlanReadOnly = billingLocked
    const planName =
      user?.assignedPlanName ||
      user?.customPlanLabel ||
      user?.currentPlan?.name ||
      'Your plan'

    const featureKey = (segment) => featureKeyForSegment(segment)

    const isFeatureEnabled = (key) => {
      if (!key) return true
      if (kycLocked) return false
      return featureFlags[key] !== false
    }

    /** Hide sidebar items not included in the plan/trial (show locks when billing expired or KYC pending). */
    const isFeatureHidden = (segment, explicitKey) => {
      if (kycLocked || billingLocked) return false
      const key = explicitKey || featureKey(segment)
      if (!key) return false
      return featureFlags[key] === false
    }

    const isNavReadOnly = (segment) => {
      if (kycLocked) return !isNavUnlockedWhenKycPending(segment)
      if (billingLocked) return !isNavUnlockedWhenBillingLocked(segment)
      return false
    }

    const isNavLocked = (segment) => {
      if (kycLocked) return !isNavUnlockedWhenKycPending(segment)
      if (billingLocked) return !isNavUnlockedWhenBillingLocked(segment)
      const key = featureKey(segment)
      return Boolean(key && featureFlags[key] === false)
    }

    const lockMessage = (segment) => {
      if (kycLocked && !isNavUnlockedWhenKycPending(segment)) {
        return 'Complete KYC verification to unlock this feature.'
      }
      if (billingLocked && !isNavUnlockedWhenBillingLocked(segment)) {
        return user?.accessTier === 'expired' && user?.planEndDate
          ? 'Subscription expired — renew to unlock.'
          : 'Trial expired — subscribe to unlock.'
      }
      if (featureKey(segment) && featureFlags[featureKey(segment)] === false) {
        const key = featureKey(segment)
        return `${PLAN_FEATURE_LABELS[key] || 'This feature'} is not included in ${planName}.`
      }
      return 'This feature is locked.'
    }

    const toastLocked = (segment) => {
      if (kycLocked && !isNavUnlockedWhenKycPending(segment)) {
        return 'Verify your KYC to unlock menu, orders, POS, and all restaurant features.'
      }
      if (billingLocked && !isNavUnlockedWhenBillingLocked(segment)) {
        if (user?.planEndDate && !user?.isTrialActive) {
          return 'Your subscription has expired. Renew from Subscription to unlock features.'
        }
        return 'Your trial has expired. Choose a plan from Subscription to continue.'
      }
      const key = featureKey(segment)
      if (key && featureFlags[key] === false) {
        return `${PLAN_FEATURE_LABELS[key] || 'This feature'} is not included in ${planName}.`
      }
      return 'This feature is locked.'
    }

    return {
      user,
      featureFlags,
      kycLocked,
      billingLocked,
      isPlanReadOnly,
      planName,
      isFeatureEnabled,
      isFeatureHidden,
      isNavReadOnly,
      isNavLocked,
      lockMessage,
      toastLocked,
      featureKey,
    }
  }, [user])
}
