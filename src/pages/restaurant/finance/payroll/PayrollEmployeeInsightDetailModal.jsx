import React, { useMemo } from 'react'
import Button from '../../../../components/common/Button'
import Modal from '../../../../components/common/Modal'
import { adPayrollMonthYearToBs } from '../../../../utils/nepaliDateFormat'
import { money } from '../FinanceUI'
import { formatEnglishPeriod } from './payrollUtils'

function Tile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-surface-200 bg-surface-50/90 p-3 dark:border-gray-800 dark:bg-gray-950/60">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-base font-semibold tabular-nums text-gray-950 dark:text-gray-100">{value}</p>
      {hint ? <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">{hint}</p> : null}
    </div>
  )
}

export default function PayrollEmployeeInsightDetailModal({
  isOpen,
  onClose,
  summaryRow,
  monthlyRows,
  staffDirectory,
  periodLabel,
}) {
  const profile = useMemo(() => {
    if (!summaryRow) return null
    const id = String(summaryRow.employeeId)
    return (staffDirectory || []).find((e) => String(e._id) === id) || null
  }, [summaryRow, staffDirectory])

  const rowsForEmployee = useMemo(() => {
    if (!summaryRow || !monthlyRows?.length) return []
    const id = String(summaryRow.employeeId)
    return monthlyRows.filter((r) => String(r.employeeId) === id)
  }, [summaryRow, monthlyRows])

  const cashOutSum = useMemo(
    () => rowsForEmployee.reduce((s, r) => s + Number(r.cashOutflow || 0), 0),
    [rowsForEmployee],
  )

  if (!summaryRow) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={summaryRow.name} size="xl">
      <div className="max-h-[85vh] overflow-y-auto px-6 pb-6 pt-2">
        <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
          {summaryRow.department ? <span>{summaryRow.department}</span> : null}
          {summaryRow.panNumber ? <span>PAN {summaryRow.panNumber}</span> : null}
          {profile?.designation ? <span>{profile.designation}</span> : null}
          {profile?.phone ? <span>{profile.phone}</span> : null}
          {profile?.email ? <span className="break-all">{profile.email}</span> : null}
        </div>
        <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">Range: {periodLabel}</p>

        <section className="mb-6">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Summary (this range)
          </h4>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <Tile label="Runs" value={summaryRow.payrollMonths} hint="Payroll months" />
            <Tile label="TDS" value={money(summaryRow.ytdTdsWithheld)} hint="Withheld" />
            <Tile label="Net paid" value={money(summaryRow.totalNetSalaryPaid)} hint="Paid status" />
            <Tile label="Net pending" value={money(summaryRow.totalNetSalaryPending)} hint="Unpaid" />
            <Tile label="EPF employee" value={money(summaryRow.ytdEmployeeEpf)} />
            <Tile label="EPF employer" value={money(summaryRow.ytdEmployerEpf)} />
            <Tile label="EPF total" value={money(summaryRow.epfCombined)} />
            <Tile label="Cash out Σ" value={money(cashOutSum)} hint="Net + EPF / run" />
          </div>
        </section>

        <section>
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            By month
          </h4>
          {rowsForEmployee.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No rows in this range.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-surface-200 dark:border-gray-800">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="bg-surface-50 text-xs font-semibold uppercase text-gray-600 dark:bg-gray-950 dark:text-gray-400">
                  <tr>
                    <th className="px-3 py-2">Period (AD)</th>
                    <th className="px-3 py-2">BS</th>
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
                  {rowsForEmployee.map((row) => {
                    const bs = adPayrollMonthYearToBs(row.periodMonth, row.periodYear)
                    return (
                      <tr key={String(row.payrollId)} className="bg-white dark:bg-gray-900">
                        <td className="px-3 py-2 font-medium text-gray-900 dark:text-gray-100">
                          {formatEnglishPeriod(row.periodMonth, row.periodYear)}
                        </td>
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{bs || '—'}</td>
                        <td className="px-3 py-2 capitalize text-gray-700 dark:text-gray-300">{row.paymentStatus || '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(row.netSalary)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(row.tds)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(row.epfEmployee)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(row.epfEmployer)}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">{money(row.epfTotal)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money(row.cashOutflow)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-end border-t border-surface-100 pt-4 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
