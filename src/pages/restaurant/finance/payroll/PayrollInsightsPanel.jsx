import React, { useEffect, useMemo, useState } from 'react'
import { FiChevronDown, FiChevronUp, FiRefreshCw, FiSearch } from 'react-icons/fi'
import Button from '../../../../components/common/Button'
import Input from '../../../../components/common/Input'
import Select from '../../../../components/common/Select'
import { adPayrollMonthYearToBs } from '../../../../utils/nepaliDateFormat'
import { EmptyState, FinancePanel, money } from '../FinanceUI'
import { PAYROLL_SUMMARY_MONTH_PRESETS, formatEnglishPeriod } from './payrollUtils'
import PayrollEmployeeInsightDetailModal from './PayrollEmployeeInsightDetailModal'
import PayrollPaginationBar, { PAYROLL_PAGE_SIZES, paginate } from './PayrollPaginationBar'

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const m = i + 1
  return { value: m, label: formatEnglishPeriod(m, 2026).split(' ')[0] }
})

const INSIGHT_PRESET_OPTIONS = [
  { value: 'full', label: 'Full year (Jan–Dec)' },
  { value: 'h1', label: 'H1 (Jan–Jun)' },
  { value: 'h2', label: 'H2 (Jul–Dec)' },
  { value: 'q1', label: 'Q1 (Jan–Mar)' },
  { value: 'q2', label: 'Q2 (Apr–Jun)' },
  { value: 'q3', label: 'Q3 (Jul–Sep)' },
  { value: 'q4', label: 'Q4 (Oct–Dec)' },
  { value: 'custom', label: 'Custom (set end month)' },
]

function inferPreset(monthFrom, monthTo) {
  for (const [id, [a, b]] of Object.entries(PAYROLL_SUMMARY_MONTH_PRESETS)) {
    if (monthFrom === a && monthTo === b) return id
  }
  return 'custom'
}

function MiniStat({ label, value, hint }) {
  return (
    <div className="min-w-[6.5rem] flex-1">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-0.5 text-base font-bold tabular-nums text-gray-950 dark:text-gray-100">{value}</p>
      {hint ? <p className="text-[10px] text-gray-400 dark:text-gray-500">{hint}</p> : null}
    </div>
  )
}

export default function PayrollInsightsPanel({
  insightsPeriodAdIso,
  insightsPayrollPeriodBs,
  onInsightsPayPeriodChange,
  statsYear,
  summaryMonthFrom,
  setSummaryMonthFrom,
  summaryMonthTo,
  setSummaryMonthTo,
  summaryEmployeeId,
  setSummaryEmployeeId,
  summarySearch,
  setSummarySearch,
  staffDirectory,
  employeeSummary,
  summaryLoading,
  onRefresh,
}) {
  const [totalsOpen, setTotalsOpen] = useState(false)
  const [detailRow, setDetailRow] = useState(null)
  const [empPage, setEmpPage] = useState(1)
  const [empPageSize, setEmpPageSize] = useState(PAYROLL_PAGE_SIZES[0])
  const [ledgerPage, setLedgerPage] = useState(1)
  const [ledgerPageSize, setLedgerPageSize] = useState(PAYROLL_PAGE_SIZES[0])

  const presetValue = inferPreset(summaryMonthFrom, summaryMonthTo)

  const onToMonthChange = (v) => {
    setSummaryMonthTo(v)
    if (v < summaryMonthFrom) setSummaryMonthFrom(v)
  }

  const filteredMonthly = useMemo(() => {
    const rows = employeeSummary?.monthlyRows || []
    const q = summarySearch.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((r) => (r.employeeName || '').toLowerCase().includes(q))
  }, [employeeSummary?.monthlyRows, summarySearch])

  const employeesAll = employeeSummary?.employees ?? []
  const empPg = paginate(employeesAll, empPage, empPageSize)
  const ledgerPg = paginate(filteredMonthly, ledgerPage, ledgerPageSize)

  useEffect(() => {
    if (empPg.safePage !== empPage) setEmpPage(empPg.safePage)
  }, [empPg.safePage, empPage])

  useEffect(() => {
    if (ledgerPg.safePage !== ledgerPage) setLedgerPage(ledgerPg.safePage)
  }, [ledgerPg.safePage, ledgerPage])

  useEffect(() => {
    setEmpPage(1)
  }, [employeeSummary, summaryEmployeeId])

  useEffect(() => {
    setLedgerPage(1)
  }, [employeeSummary, summarySearch])

  const periodLabel = `${formatEnglishPeriod(summaryMonthFrom, statsYear)} – ${formatEnglishPeriod(summaryMonthTo, statsYear)}`

  const t = employeeSummary?.totals

  return (
    <FinancePanel
      title="Employee insights"
      actions={(
        <Button type="button" size="sm" variant="secondary" loading={summaryLoading} onClick={onRefresh}>
          <FiRefreshCw className="mr-1 inline h-4 w-4" aria-hidden />
          Refresh
        </Button>
      )}
    >
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Nepali date picker sets the <span className="font-semibold">start month</span> (AD year + from-month). Adjust the end month or a preset for the window.
      </p>

      <div className="mb-6 space-y-4 rounded-2xl border border-surface-200 bg-surface-50/80 p-4 dark:border-gray-800 dark:bg-gray-950/40">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-4">
            <Input
              label="Range start (Nepali calendar)"
              type="date"
              name="insightsPayPeriod"
              value={insightsPeriodAdIso}
              onChange={onInsightsPayPeriodChange}
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-mono text-gray-700 dark:text-gray-300">
                {summaryMonthFrom}/{statsYear}
              </span>
              {insightsPayrollPeriodBs ? (
                <>
                  {' '}
                  · <span className="text-emerald-800 dark:text-emerald-300">{insightsPayrollPeriodBs}</span>
                </>
              ) : null}
            </p>
          </div>
          <div className="lg:col-span-3">
            <Select
              label="Quick range"
              value={presetValue}
              title="Preset month span within the selected year"
              onValueChange={(id) => {
                if (id === 'custom') return
                const r = PAYROLL_SUMMARY_MONTH_PRESETS[id]
                if (r) {
                  const a = r[0]
                  const b = r[1]
                  setSummaryMonthFrom(a)
                  setSummaryMonthTo(b)
                }
              }}
              options={INSIGHT_PRESET_OPTIONS}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              label="End month"
              value={summaryMonthTo}
              onValueChange={(v) => onToMonthChange(Number(v))}
              options={MONTH_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            />
          </div>
          <div className="lg:col-span-2">
            <Select
              label="Employee"
              placeholder="All staff"
              value={summaryEmployeeId || ''}
              onValueChange={(v) => setSummaryEmployeeId(v)}
              options={(staffDirectory || [])
                .filter((e) => e.isActive !== false)
                .map((e) => ({ value: String(e._id), label: e.name }))}
            />
          </div>
          <div className="lg:col-span-3">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              <FiSearch className="mr-1 inline h-3.5 w-3.5 opacity-70" aria-hidden />
              Search ledger
            </label>
            <input
              type="search"
              value={summarySearch}
              onChange={(e) => setSummarySearch(e.target.value)}
              placeholder="Name…"
              className="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-3.5 pr-3 text-sm font-medium text-gray-900 shadow-sm transition duration-150 hover:border-surface-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-gray-600 dark:focus:border-primary-400 dark:focus:ring-primary-500/25"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Window: <span className="font-semibold text-gray-700 dark:text-gray-300">{periodLabel}</span>
          {presetValue !== 'custom' && presetValue !== 'full' && (
            <span className="ml-2 rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-700 shadow-sm dark:bg-gray-900 dark:text-primary-300">
              {presetValue}
            </span>
          )}
        </p>
      </div>

      {t && (
        <div className="mb-6 rounded-2xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-end gap-x-8 gap-y-3 p-4">
            <MiniStat label="TDS" value={money(t.ytdTdsWithheld)} />
            <MiniStat label="Net paid" value={money(t.totalNetSalaryPaid)} />
            <MiniStat label="Net pending" value={money(t.totalNetSalaryPending)} />
            <MiniStat label="EPF emp." value={money(t.ytdEmployeeEpf)} />
            <MiniStat label="EPF total" value={money(t.epfCombined)} hint="emp + co." />
          </div>
          <div className="border-t border-surface-100 dark:border-gray-800">
            <button
              type="button"
              aria-expanded={totalsOpen}
              onClick={() => setTotalsOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-2 text-left text-xs font-semibold text-gray-600 hover:bg-surface-50 dark:text-gray-400 dark:hover:bg-gray-800/80"
            >
              <span>Why these numbers</span>
              {totalsOpen ? <FiChevronUp className="h-4 w-4 opacity-70" aria-hidden /> : <FiChevronDown className="h-4 w-4 opacity-70" aria-hidden />}
            </button>
            {totalsOpen && (
              <p className="border-t border-surface-100 px-4 py-3 text-xs leading-relaxed text-gray-500 dark:border-gray-800 dark:text-gray-400">
                Figures sum payroll rows in <span className="font-medium text-gray-700 dark:text-gray-300">{periodLabel}</span>
                {summaryEmployeeId ? ' for the selected employee' : ' for all staff'}
                . Net paid / pending follow payment status. EPF total is employee + employer shares.
              </p>
            )}
          </div>
        </div>
      )}

      <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">By employee</h3>
      <div className="mb-8 overflow-hidden rounded-xl border border-surface-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-[800px] w-full text-left text-sm">
            <thead className="bg-surface-50 text-xs font-bold uppercase text-gray-600 dark:bg-gray-950 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Dept</th>
                <th className="px-3 py-2 text-right">Months</th>
                <th className="px-3 py-2 text-right">TDS</th>
                <th className="px-3 py-2 text-right">Net paid</th>
                <th className="px-3 py-2 text-right">Net pending</th>
                <th className="px-3 py-2 text-right">EPF (emp.)</th>
                <th className="px-3 py-2 text-right">EPF (co.)</th>
                <th className="px-3 py-2 text-right">EPF Σ</th>
                <th className="px-3 py-2 w-28"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
              {empPg.slice.map((r) => (
                <tr key={String(r.employeeId)} className="bg-white dark:bg-gray-900">
                  <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                    {r.name}
                    {r.panNumber ? <span className="mt-0.5 block text-xs font-normal text-gray-500">PAN {r.panNumber}</span> : null}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{r.department || '—'}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.payrollMonths}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-amber-800 dark:text-amber-200">{money(r.ytdTdsWithheld)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-300">{money(r.totalNetSalaryPaid)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-gray-600 dark:text-gray-400">{money(r.totalNetSalaryPending)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(r.ytdEmployeeEpf)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{money(r.ytdEmployerEpf)}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{money(r.epfCombined)}</td>
                  <td className="px-3 py-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => setDetailRow(r)}>
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <PayrollPaginationBar
          page={empPg.safePage}
          pageSize={empPageSize}
          total={empPg.total}
          totalPages={empPg.totalPages}
          from={empPg.from}
          to={empPg.to}
          onPageChange={setEmpPage}
          onPageSizeChange={(n) => {
            setEmpPageSize(n)
            setEmpPage(1)
          }}
        />
      </div>
      {!summaryLoading && (!employeeSummary?.employees || employeeSummary.employees.length === 0) && (
        <div className="mb-8">
          <EmptyState>No payroll in this range. Generate payroll or widen filters.</EmptyState>
        </div>
      )}

      <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-gray-100">Ledger (each run)</h3>
      <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full text-left text-sm">
            <thead className="bg-surface-50 text-xs font-bold uppercase text-gray-600 dark:bg-gray-950 dark:text-gray-400">
              <tr>
                <th className="px-3 py-2">Period (AD)</th>
                <th className="px-3 py-2">BS</th>
                <th className="px-3 py-2">Employee</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Net</th>
                <th className="px-3 py-2 text-right">TDS</th>
                <th className="px-3 py-2 text-right">EPF emp.</th>
                <th className="px-3 py-2 text-right">EPF co.</th>
                <th className="px-3 py-2 text-right">EPF Σ</th>
                <th className="px-3 py-2 text-right">Cash out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-gray-800">
              {ledgerPg.slice.map((row) => {
                const bs = adPayrollMonthYearToBs(row.periodMonth, row.periodYear)
                return (
                  <tr key={String(row.payrollId)} className="bg-white dark:bg-gray-900">
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">
                      {formatEnglishPeriod(row.periodMonth, row.periodYear)}
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{bs || '—'}</td>
                    <td className="px-3 py-2">
                      <span className="font-medium text-gray-900 dark:text-gray-100">{row.employeeName}</span>
                      {row.department ? (
                        <span className="mt-0.5 block text-xs text-gray-500">{row.department}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2">
                      <span className="rounded-full bg-surface-100 px-2 py-0.5 text-xs font-semibold capitalize dark:bg-gray-800">
                        {row.paymentStatus || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(row.netSalary)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(row.tds)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(row.epfEmployee)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{money(row.epfEmployer)}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-medium">{money(row.epfTotal)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-gray-800 dark:text-gray-200">{money(row.cashOutflow)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <PayrollPaginationBar
          page={ledgerPg.safePage}
          pageSize={ledgerPageSize}
          total={ledgerPg.total}
          totalPages={ledgerPg.totalPages}
          from={ledgerPg.from}
          to={ledgerPg.to}
          onPageChange={setLedgerPage}
          onPageSizeChange={(n) => {
            setLedgerPageSize(n)
            setLedgerPage(1)
          }}
        />
      </div>
      {!summaryLoading && filteredMonthly.length === 0 && (employeeSummary?.monthlyRows?.length > 0) && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No rows match your search.</p>
      )}
      {!summaryLoading && (!employeeSummary?.monthlyRows || employeeSummary.monthlyRows.length === 0) && (
        <EmptyState>No rows in this range.</EmptyState>
      )}

      <PayrollEmployeeInsightDetailModal
        isOpen={Boolean(detailRow)}
        onClose={() => setDetailRow(null)}
        summaryRow={detailRow}
        monthlyRows={employeeSummary?.monthlyRows}
        staffDirectory={staffDirectory}
        periodLabel={periodLabel}
      />
    </FinancePanel>
  )
}
