import { useMemo } from 'react'
import { useAuth } from './useAuth'
import { featureKeyForSegment, isNavUnlockedWhenBillingLocked, PLAN_FEATURE_LABELS } from '../constants/planFeatureMap'

export function usePlanAccess() {
  const { user } = useAuth()

  return useMemo(() => {
    const isRestaurantOwner = user?.role === 'restaurant' && user?.scope !== 'employee'
    const featureFlags = user?.planFeatureFlags || {}
    const billingLocked = isRestaurantOwner && user?.needsPlanUpgrade === true
    const isPlanReadOnly = billingLocked
    const planName =
      user?.assignedPlanName ||
      user?.customPlanLabel ||
      user?.currentPlan?.name ||
      'Your plan'

    const featureKey = (segment) => featureKeyForSegment(segment)

    const isFeatureEnabled = (key) => {
      if (!key) return true
      return featureFlags[key] !== false
    }

    /** Hide sidebar items not included in the plan/trial (show locks instead when billing expired). */
    const isFeatureHidden = (segment, explicitKey) => {
      if (billingLocked) return false
      const key = explicitKey || featureKey(segment)
      if (!key) return false
      return featureFlags[key] === false
    }

    /** Expired trial/plan: show item with lock icon, allow read-only navigation. */
    const isNavReadOnly = (segment) => {
      if (!billingLocked) return false
      return !isNavUnlockedWhenBillingLocked(segment)
    }

    const isNavLocked = (segment) => {
      if (billingLocked) return !isNavUnlockedWhenBillingLocked(segment)
      const key = featureKey(segment)
      return Boolean(key && featureFlags[key] === false)
    }

    const lockMessage = (segment) => {
      const key = featureKey(segment)
      if (billingLocked && !isNavUnlockedWhenBillingLocked(segment)) {
        return user?.accessTier === 'expired' && user?.planEndDate
          ? 'Subscription expired — renew to unlock.'
          : 'Trial expired — subscribe to unlock.'
      }
      if (key && featureFlags[key] === false) {
        return `${PLAN_FEATURE_LABELS[key] || 'This feature'} is not included in ${planName}.`
      }
      return 'This feature is locked.'
    }

    const toastLocked = (segment) => {
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
