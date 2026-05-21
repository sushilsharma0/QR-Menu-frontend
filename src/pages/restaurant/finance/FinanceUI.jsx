import React from 'react'
import { FiBarChart2 } from 'react-icons/fi'

export const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export function FinancePageShell({ children, className = '' }) {
  return <div className={`portal-page ${className}`}>{children}</div>
}

export function FinancePageHeader({ title, subtitle, actions }) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-gradient-to-br from-surface-50 via-white to-primary-50/40 px-5 py-5 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 lg:px-6 lg:py-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary-800 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-primary-300 sm:text-xs">
            <FiBarChart2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Accounting
          </span>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 dark:text-gray-100 lg:text-[1.65rem] xl:text-3xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 max-w-3xl text-xs leading-relaxed text-gray-600 dark:text-gray-400 sm:text-sm">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

/** 6 KPI cards: 3×2 on 13.5" laptops; single row only on very wide screens */
export function FinanceMetricsGrid({ children, className = '', columns = 6 }) {
  const gridClass = columns === 4 ? 'finance-metrics-grid--4' : 'finance-metrics-grid'
  return <div className={`${gridClass} ${className}`}>{children}</div>
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
    <div className="rounded-2xl border border-surface-200 bg-white p-3.5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase leading-snug tracking-wide text-gray-500 sm:text-[11px] dark:text-gray-400">
            {label}
          </p>
          <p
            className="mt-1.5 truncate text-base font-semibold leading-tight tabular-nums text-gray-950 sm:mt-2 sm:text-lg laptop:text-xl 2xl:text-2xl dark:text-gray-100"
            title={String(value ?? '—')}
          >
            {value ?? '—'}
          </p>
          {sub && <p className="mt-0.5 truncate text-[11px] text-gray-500 sm:text-xs dark:text-gray-400">{sub}</p>}
        </div>
        {Icon && (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-lg sm:h-10 sm:w-10 laptop:h-11 laptop:w-11 ${tones[tone] || tones.primary}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  )
}

export function FinancePanel({ title, children, actions, className = '', bodyClassName = '' }) {
  return (
    <section className={`rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}>
      {(title || actions) && (
        <div className="flex flex-col gap-2 border-b border-surface-100 px-4 py-3 dark:border-gray-800 sm:px-5 sm:py-3.5 md:flex-row md:items-center md:justify-between">
          {title && (
            <h2 className="inline-flex items-center gap-2 text-base font-semibold text-gray-950 dark:text-gray-100 sm:text-lg">
              <FiBarChart2 className="h-4 w-4 text-primary-700 dark:text-primary-300 sm:h-5 sm:w-5" />
              {title}
            </h2>
          )}
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={`p-4 sm:p-5 ${bodyClassName}`}>{children}</div>
    </section>
  )
}

export function FinanceRow({ title, meta, amount, status, action, danger = false }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-950 dark:text-gray-100">{title}</p>
        {meta && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{meta}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {status && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm dark:bg-gray-800 dark:text-gray-200">
            {status}
          </span>
        )}
        {amount && (
          <span className={`font-semibold ${danger ? 'text-red-600' : 'text-primary-700 dark:text-primary-300'}`}>
            {amount}
          </span>
        )}
        {action}
      </div>
    </div>
  )
}

export function EmptyState({ children }) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-300 bg-surface-50/60 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-400">
      {children}
    </div>
  )
}

export function FinanceChartBox({
  children,
  empty,
  emptyTitle = 'No chart data yet',
  emptyText = 'Data will appear here once records are available.',
  compact = false,
}) {
  return (
    <div className="rounded-2xl border border-surface-200 bg-gradient-to-b from-white to-surface-50/80 p-3 shadow-inner dark:border-gray-800 dark:from-gray-950 dark:to-gray-900 sm:rounded-3xl sm:p-4">
      {empty ? (
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl bg-white/70 px-4 text-center dark:bg-gray-900 sm:min-h-64">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-700 shadow-sm dark:bg-gray-800 dark:text-primary-300 sm:h-14 sm:w-14">
            <FiBarChart2 className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <h3 className="mt-3 text-base font-semibold text-gray-950 dark:text-gray-100 sm:text-lg">{emptyTitle}</h3>
          <p className="mt-1 max-w-md text-xs text-gray-500 dark:text-gray-400 sm:text-sm">{emptyText}</p>
        </div>
      ) : (
        <div className={compact ? 'finance-chart-area--sm' : 'finance-chart-area'}>{children}</div>
      )}
    </div>
  )
}

export function FinanceTooltip({ active, payload, label, labelFormatter, valuePrefix = 'Rs. ', valueSuffix = '' }) {
  if (!active || !payload?.length) return null
  const displayLabel = labelFormatter ? labelFormatter(label) : (label || payload[0]?.name || payload[0]?.payload?.name || '')

  return (
    <div className="rounded-2xl border border-surface-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      {displayLabel && (
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
          {displayLabel}
        </p>
      )}
      <div className="mt-2 space-y-1">
        {payload.map((item) => (
          <p key={item.dataKey} className="flex items-center justify-between gap-6 text-sm">
            <span className="text-gray-500 dark:text-gray-400">{item.name || item.dataKey}</span>
            <span className="font-semibold text-primary-700 dark:text-primary-300">
              {typeof item.value === 'number'
                ? `${valuePrefix}${Number(item.value || 0).toLocaleString('en-IN')}${valueSuffix}`
                : item.value}
            </span>
          </p>
        ))}
      </div>
    </div>
  )
}
