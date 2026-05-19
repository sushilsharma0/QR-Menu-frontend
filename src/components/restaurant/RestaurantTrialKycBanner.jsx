import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiAlertCircle, FiShield } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

const RestaurantTrialKycBanner = () => {
  const { user } = useAuth()
  const { restaurantBase } = useTenantRoutes()

  const trialDaysLeft = useMemo(() => {
    if (!user?.trialEndsAt || user?.scope !== 'restaurant') return null
    const end = new Date(user.trialEndsAt)
    const d = Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return d
  }, [user?.trialEndsAt, user?.scope])

  if (user?.role !== 'restaurant' && user?.scope !== 'restaurant') return null

  const needsKyc = user?.isKYCVerified === false
  const trialWarn =
    typeof trialDaysLeft === 'number' && trialDaysLeft >= 0 && trialDaysLeft <= 7 && !user?.hasPaidPlanActive
  const trialEnded =
    user?.needsPlanUpgrade === true ||
    (typeof trialDaysLeft === 'number' && trialDaysLeft <= 0 && !user?.hasPaidPlanActive)

  return (
    <div className="space-y-2 mb-4">
      {needsKyc && (
        <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <FiShield className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">KYC verification pending</p>
            <p className="mt-1 text-amber-800">
              Your active trial and super-admin feature permissions decide what is available. Complete KYC when ready for compliance review.
            </p>
            <Link to={`${restaurantBase}/kyc`} className="mt-2 inline-block font-medium text-amber-950 underline">
              Go to KYC
            </Link>
          </div>
        </div>
      )}

      {(trialWarn || trialEnded) && (
        <div
          className={`flex items-start gap-3 rounded-lg border px-4 py-3 text-sm ${
            trialEnded
              ? 'border-red-200 bg-red-50 text-red-900'
              : 'border-blue-200 bg-blue-50 text-blue-900'
          }`}
        >
          <FiAlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            {trialEnded ? (
              <>
                <p className="font-medium">Trial or plan ended — read-only mode</p>
                <p className="mt-1 opacity-90">
                  You can still view your data, but editing is disabled. Renew your subscription to restore full access.
                </p>
              </>
            ) : (
              <>
                <p className="font-medium">Trial ending soon</p>
                <p className="mt-1 opacity-90">
                  {trialDaysLeft === 0
                    ? 'Your trial ends today.'
                    : `${trialDaysLeft} day(s) left on your trial.`}{' '}
                  Verify KYC and choose a plan before it ends.
                </p>
              </>
            )}
            <Link
              to={`${restaurantBase}/subscription`}
              className="mt-2 inline-block font-medium underline text-current"
            >
              Subscription & plans
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default RestaurantTrialKycBanner
