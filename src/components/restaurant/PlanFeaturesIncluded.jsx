import React from 'react'
import { FiCheck, FiX } from 'react-icons/fi'
import { PLAN_FEATURE_LABELS } from '../../constants/planFeatureMap'

const EMPTY_FEATURE_FLAGS = {}

export default function PlanFeaturesIncluded({ featureFlags = EMPTY_FEATURE_FLAGS, planName = 'Your plan' }) {
  const entries = Object.entries(PLAN_FEATURE_LABELS)

  if (!entries.length) return null

  const enabled = entries.filter(([key]) => featureFlags[key] !== false)
  const disabled = entries.filter(([key]) => featureFlags[key] === false)

  return (
    <div className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        Modules included in {planName}
      </h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Only enabled modules appear in your restaurant sidebar.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {enabled.map(([key, label]) => (
          <li key={key} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
            <FiCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            {label}
          </li>
        ))}
        {disabled.map(([key, label]) => (
          <li key={key} className="flex items-center gap-2 text-sm text-gray-400 line-through dark:text-gray-500">
            <FiX className="h-4 w-4 flex-shrink-0" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  )
}
