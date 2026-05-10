import React, { useState } from 'react'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { money } from '../FinanceUI'

function MiniStat({ label, value, hint }) {
  return (
    <div className="min-w-[7.5rem] flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold tabular-nums text-gray-950 dark:text-gray-100">{value}</p>
      {hint ? <p className="text-[10px] text-gray-400 dark:text-gray-500">{hint}</p> : null}
    </div>
  )
}

function BreakRow({ label, value }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-surface-100 py-2 last:border-0 dark:border-gray-800">
      <span className="text-gray-600 dark:text-gray-400">{label}</span>
      <span className="shrink-0 font-semibold tabular-nums text-gray-950 dark:text-gray-100">{value}</span>
    </div>
  )
}

export default function PayrollMetricsStrip({ summary }) {
  const [open, setOpen] = useState(false)

  if (!summary) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-200 px-4 py-5 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
        Load a pay period to see totals.
      </div>
    )
  }

  const paid = summary.paidSalaries ?? 0
  const pending = summary.pendingSalaries ?? 0
  const ot = Number(summary.totalOvertimePay || 0)
  const bonus = Number(summary.totalBonus || 0)

  return (
    <div className="rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-4 p-4 sm:p-5">
        <MiniStat label="Net pay" value={money(summary.totalPayrollCost)} />
        <MiniStat label="Cash out" value={money(summary.totalPayrollOutflow)} hint="Net + EPF" />
        <div className="min-w-[9rem] flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Runs</p>
          <p className="mt-0.5 text-lg font-bold tabular-nums">
            <span className="text-emerald-700 dark:text-emerald-400">{paid} paid</span>
            <span className="mx-1.5 font-normal text-gray-300 dark:text-gray-600">·</span>
            <span className="text-amber-700 dark:text-amber-400">{pending} open</span>
          </p>
        </div>
      </div>

      <div className="border-t border-surface-100 dark:border-gray-800">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-left text-xs font-semibold text-gray-600 transition hover:bg-surface-50 dark:text-gray-400 dark:hover:bg-gray-800/80 sm:px-5"
        >
          <span>More</span>
          {open ? <FiChevronUp className="h-4 w-4 shrink-0 opacity-70" aria-hidden /> : <FiChevronDown className="h-4 w-4 shrink-0 opacity-70" aria-hidden />}
        </button>
        {open && (
          <div className="border-t border-surface-100 bg-surface-50/60 px-4 py-1 dark:border-gray-800 dark:bg-gray-950/50 sm:px-5">
            <BreakRow label="TDS" value={money(summary.totalTds)} />
            <BreakRow label="EPF (employee)" value={money(summary.totalEpf)} />
            <BreakRow label="EPF (employer)" value={money(summary.totalEmployerEpf)} />
            {ot > 0 ? <BreakRow label="Overtime" value={money(summary.totalOvertimePay)} /> : null}
            {bonus > 0 ? <BreakRow label="Bonuses" value={money(summary.totalBonus)} /> : null}
          </div>
        )}
      </div>
    </div>
  )
}
