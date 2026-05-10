import React from 'react'
import { FiBarChart2 } from 'react-icons/fi'

export const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export function FinancePageHeader({ title, subtitle, actions }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-[#fff8ed] via-white to-emerald-50 px-7 py-7 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-800 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-primary-300">
            <FiBarChart2 className="h-4 w-4" />
            Accounting
          </span>
          <h1 className="mt-4 text-3xl font-black text-gray-950 dark:text-gray-100">{title}</h1>
          {subtitle && <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function FinanceMetric({ label, value, sub, icon: Icon, tone = 'primary' }) {
  const tones = {
    primary: 'bg-primary-700 text-white',
    success: 'bg-teal-500 text-white',
    warning: 'bg-orange-500 text-white',
    danger: 'bg-red-600 text-white',
    neutral: 'bg-violet-600 text-white',
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
          <p className="mt-3 truncate text-2xl font-black text-gray-950 dark:text-gray-100">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
        </div>
        {Icon && (
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-lg ${tones[tone] || tones.primary}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  )
}

export function FinancePanel({ title, children, actions, className = '' }) {
  return (
    <section className={`rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-3 border-b border-surface-100 px-5 py-4 dark:border-gray-800 md:flex-row md:items-center md:justify-between">
          {title && (
            <h2 className="inline-flex items-center gap-2 text-lg font-bold text-gray-950 dark:text-gray-100">
              <FiBarChart2 className="h-5 w-5 text-primary-700 dark:text-primary-300" />
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  )
}

export function FinanceRow({ title, meta, amount, status, action, danger = false }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-950 dark:text-gray-100">{title}</p>
        {meta && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{meta}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {status && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:bg-gray-800 dark:text-gray-200">{status}</span>}
        {amount && <span className={`font-bold ${danger ? 'text-red-600' : 'text-primary-700 dark:text-primary-300'}`}>{amount}</span>}
        {action}
      </div>
    </div>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50/40 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
      {children}
    </div>
  )
}

export function FinanceChartBox({ children, empty, emptyTitle = 'No chart data yet', emptyText = 'Data will appear here once records are available.' }) {
  return (
    <div className="rounded-3xl border border-amber-100 bg-gradient-to-b from-white to-[#fffaf0] p-4 shadow-inner dark:border-gray-800 dark:from-gray-950 dark:to-gray-900">
      {empty ? (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-2xl bg-white/70 px-4 text-center dark:bg-gray-900">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-300">
            <FiBarChart2 className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-950 dark:text-gray-100">{emptyTitle}</h3>
          <p className="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{emptyText}</p>
        </div>
      ) : (
        children
      )}
    </div>
  )
}

export function FinanceTooltip({ active, payload, label, labelFormatter, valuePrefix = 'Rs. ' }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-amber-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{item.name || item.dataKey}</span>
            <span className="font-bold text-primary-700 dark:text-primary-300">
              {typeof item.value === 'number' ? `${valuePrefix}${Number(item.value || 0).toLocaleString('en-IN')}` : item.value}
            </span>
          </p>
        ))}
      </div>
    </div>
  )
}
