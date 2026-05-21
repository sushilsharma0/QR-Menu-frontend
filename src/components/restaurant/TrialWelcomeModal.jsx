import React, { useMemo } from 'react'
import { FiCheck, FiClock, FiX, FiZap } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { useAuth } from '../../hooks/useAuth'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { PLAN_FEATURE_LABELS } from '../../constants/planFeatureMap'
import Button from '../common/Button'

export default function TrialWelcomeModal() {
  const { user, mergeUser } = useAuth()
  const { restaurantBase } = useTenantRoutes()
  const navigate = useNavigate()

  const open = Boolean(
    user?.role === 'restaurant' &&
      user?.scope !== 'employee' &&
      user?.showTrialWelcome &&
      user?.isTrialActive &&
      !user?.hasPaidPlanActive,
  )

  const enabledFeatures = useMemo(() => {
    const flags = user?.planFeatureFlags || {}
    return Object.entries(flags).reduce((features, [key, enabled]) => {
      if (enabled !== false) features.push(PLAN_FEATURE_LABELS[key] || key)
      return features
    }, [])
  }, [user?.planFeatureFlags])

  const dismiss = async () => {
    try {
      await api.post('/restaurant/auth/dismiss-trial-welcome')
      mergeUser({ showTrialWelcome: false })
    } catch {
      mergeUser({ showTrialWelcome: false })
    }
  }

  if (!open) return null

  const days = user?.trialDaysLeft ?? user?.trialDays ?? 14

  return (
    <TrialOverlay>
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
            <FiZap className="h-6 w-6" />
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
            aria-label="Close"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-4 text-xl font-semibold text-gray-950 dark:text-gray-100">Welcome, your trial is active</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          You have <strong>{days}</strong> day{days === 1 ? '' : 's'} to explore the features enabled for your
          restaurant by the platform admin. Subscribe before the trial ends to keep access.
        </p>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm font-semibold text-primary-800 dark:bg-gray-800 dark:text-primary-200">
          <FiClock className="h-4 w-4 flex-shrink-0" />
          Trial ends {user?.trialEndsAt ? new Intl.DateTimeFormat().format(new Date(user.trialEndsAt)) : 'soon'}
        </div>

        <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-gray-400">Included in your trial</p>
        <ul className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
          {enabledFeatures.length === 0 ? (
            <li className="text-sm text-gray-500">No features configured, contact support.</li>
          ) : (
            enabledFeatures.map((label) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-800 dark:bg-gray-950 dark:text-gray-200"
              >
                <FiCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                {label}
              </li>
            ))
          )}
        </ul>

        <TrialActions dismiss={dismiss} navigate={navigate} restaurantBase={restaurantBase} />
      </div>
    </TrialOverlay>
  )
}

function TrialActions({ dismiss, navigate, restaurantBase }) {
  return (
    <div className="mt-6 flex flex-wrap gap-2">
      <Button type="button" onClick={dismiss}>
        Start exploring
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          dismiss()
          navigate(`${restaurantBase}/subscription`)
        }}
      >
        View plans
      </Button>
    </div>
  )
}

function TrialOverlay({ children }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      {children}
    </div>
  )
}
