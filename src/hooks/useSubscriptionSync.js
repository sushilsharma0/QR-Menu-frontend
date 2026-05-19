import { useEffect } from 'react'
import toast from '@utils/toast'
import { useAuth } from './useAuth'
import { useSocket } from './useSocket'
import api from '../services/api'

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

    const applyAccessPayload = (payload, { notify = true } = {}) => {
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
        planLimits: payload.planLimits,
        assignedPlanName: payload.assignedPlanName,
        showTrialWelcome: payload.showTrialWelcome,
        currentPlan: payload.currentPlan || user?.currentPlan,
      })

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('restaurant:access_updated', { detail: payload }))
      }

      if (!notify) return

      if (payload.needsPlanUpgrade) {
        toast.error(
          payload.planEndDate && !payload.isTrialActive
            ? 'Your subscription has expired. Features are locked until you renew.'
            : 'Your trial has expired. Subscribe to unlock features.',
          { duration: 6000 },
        )
      } else if (payload.hasPaidPlanActive) {
        toast.success('Restaurant feature access updated.', { duration: 4500 })
      }
    }

    const refreshAccess = async () => {
      try {
        const res = await api.get('/restaurant/auth/access', { skipErrorToast: true })
        applyAccessPayload(res.data?.data, { notify: false })
      } catch {
        // Realtime refresh is best-effort; normal API guards still enforce access.
      }
    }

    const onAccessUpdated = (payload) => applyAccessPayload(payload)

    refreshAccess()
    socket.on('subscription:access_updated', onAccessUpdated)
    return () => {
      socket.off('subscription:access_updated', onAccessUpdated)
    }
  }, [socket, isConnected, mergeUser, user?.role, user?.scope, user?.currentPlan])
}
