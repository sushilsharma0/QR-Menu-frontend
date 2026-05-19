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

    /** Hide sidebar items not included in the assigned plan. */
    const isFeatureHidden = (segment, explicitKey) => {
      const key = explicitKey || featureKey(segment)
      if (!key) return false
      return featureFlags[key] === false
    }

    /** Expired trial/plan: show item with lock icon, allow read-only navigation. */
    const isNavReadOnly = (segment) => {
      if (!billingLocked) return false
      return !isNavUnlockedWhenBillingLocked(segment)
    }

    const isNavLocked = (segment) => isNavReadOnly(segment)

    const lockMessage = (segment) => {
      const key = featureKey(segment)
      if (key && featureFlags[key] === false) {
        return `${PLAN_FEATURE_LABELS[key] || 'This feature'} is not included in ${planName}.`
      }
      if (isNavReadOnly(segment)) {
        return 'Plan expired — view only. Renew subscription to make changes.'
      }
      return 'This feature is locked.'
    }

    const toastLocked = (segment) => {
      if (isNavReadOnly(segment)) {
        return 'Your trial or plan has ended. You can view data in read-only mode. Open Subscription to renew.'
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
