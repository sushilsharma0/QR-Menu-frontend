import React from 'react'
import { motion } from 'framer-motion'
import { FiCheck, FiX } from 'react-icons/fi'
import { PLAN_FEATURE_LABELS } from '../../constants/planFeatureMap'

const EMPTY_FEATURE_FLAGS = {}

export default function PlanFeaturesIncluded({
  featureFlags = EMPTY_FEATURE_FLAGS,
  planName = 'Your plan',
  expired = false,
}) {
  const entries = Object.entries(PLAN_FEATURE_LABELS)

  if (!entries.length) return null

  const enabled = entries.filter(([key]) => featureFlags[key] !== false)
  const disabled = entries.filter(([key]) => featureFlags[key] === false)
  const totalCount = entries.length
  const enabledCount = enabled.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Modules included in {planName}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {expired
              ? 'These modules were included in your plan. Renew to restore access.'
              : 'Only enabled modules appear in your restaurant sidebar.'}
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          {enabledCount}/{totalCount} enabled
        </span>
      </div>
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
    </motion.div>
  )
}
