import { useEffect } from 'react'
import toast from '@utils/toast'
import { useAuth } from './useAuth'
import { useSocket } from './useSocket'

/**
 * Applies subscription/trial access updates pushed over the restaurant socket room.
 */
export function useSubscriptionSync() {
  const { user, mergeUser } = useAuth()
  const { socket, isConnected } = useSocket()

  useEffect(() => {
    if (!socket || !isConnected || user?.role !== 'restaurant' || user?.scope === 'employee') {
      return undefined
    }

    const onAccessUpdated = (payload) => {
      if (!payload || typeof payload !== 'object') return

      mergeUser({
        trialEndsAt: payload.trialEndsAt,
        trialDays: payload.trialDays,
        trialDaysLeft: payload.trialDaysLeft,
        isTrialActive: payload.isTrialActive,
        hasPaidPlanActive: payload.hasPaidPlanActive,
        needsPlanUpgrade: payload.needsPlanUpgrade,
        canUseFeatures: payload.canUseFeatures,
        accessTier: payload.accessTier,
        planEndDate: payload.planEndDate,
        planFeatureFlags: payload.planFeatureFlags,
        assignedPlanName: payload.assignedPlanName,
        showTrialWelcome: payload.showTrialWelcome,
        currentPlan: payload.currentPlan || user?.currentPlan,
      })

      if (payload.needsPlanUpgrade) {
        toast.error(
          payload.planEndDate && !payload.isTrialActive
            ? 'Your subscription has expired. Features are locked until you renew.'
            : 'Your trial has expired. Subscribe to unlock features.',
          { duration: 6000 },
        )
      } else if (payload.hasPaidPlanActive) {
        toast.success('Your subscription is active. Features have been unlocked.', { duration: 4500 })
      }
    }

    socket.on('subscription:access_updated', onAccessUpdated)
    return () => {
      socket.off('subscription:access_updated', onAccessUpdated)
    }
  }, [socket, isConnected, mergeUser, user?.role, user?.scope, user?.currentPlan])
}
