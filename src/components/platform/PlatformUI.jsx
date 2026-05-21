import React from 'react'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import { FiInbox } from 'react-icons/fi'

export function PlatformPageHeader({ badge, title, description, icon: Icon, actions }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
      <div className="relative p-5 md:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            {badge && (
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-primary-300">
                {Icon && <Icon className="h-4 w-4" />}
                {badge}
              </div>
            )}
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-100">{title}</h1>
            {description && <p className="mt-2 max-w-3xl text-sm text-gray-500 dark:text-gray-400">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      </div>
      </m.section>
    </LazyMotion>
  )
}

export function PlatformMetric({ label, value, sub, icon: Icon, accent = 'from-primary-600 to-secondary-500' }) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-gray-100">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
        </div>
        {Icon && (
          <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
      </m.div>
    </LazyMotion>
  )
}

export function PlatformPill({ children, className = 'bg-gray-100 text-gray-700' }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>{children}</span>
}

export function PlatformEmptyState({ title = 'No data found', description, icon: Icon = FiInbox }) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 text-center dark:bg-gray-800/60">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-gray-900">
        <Icon className="h-7 w-7" />
      </div>
      <p className="mt-4 font-semibold text-gray-950 dark:text-gray-100">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{description}</p>}
    </div>
  )
}

export const platformStatusStyles = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-red-100 text-red-800',
  approved: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  rejected: 'bg-red-100 text-red-800',
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}
