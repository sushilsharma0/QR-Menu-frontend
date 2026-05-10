import React, { useEffect, useMemo, useState } from 'react'
import Button from '../../../../components/common/Button'
import { adPayrollMonthYearToBs, formatBsFromAd } from '../../../../utils/nepaliDateFormat'
import { EmptyState, FinancePanel, FinanceRow, money } from '../FinanceUI'
import PayrollPaginationBar, { PAYROLL_PAGE_SIZES, paginate } from './PayrollPaginationBar'

export default function PayrollHistorySection({ history, onSlip }) {
  const list = Array.isArray(history) ? history : []
  const paidRows = useMemo(
    () => list.filter((p) => p.paymentStatus === 'paid'),
    [list],
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAYROLL_PAGE_SIZES[0])

  const { slice, totalPages, safePage, from, to, total } = paginate(paidRows, page, pageSize)

  useEffect(() => {
    if (safePage !== page) setPage(safePage)
  }, [safePage, page])

  useEffect(() => {
    setPage(1)
  }, [history])

  const onPageSizeChange = (next) => {
    setPageSize(next)
    setPage(1)
  }

  return (
    <FinancePanel title="Payroll history">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        <strong>Paid</strong> payroll only. Pending rows stay in <strong>Payroll rows (pending)</strong> above.
      </p>
      <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-gray-800">
        <div className="space-y-2 p-3">
          {slice.map((p) => {
            const hBs = adPayrollMonthYearToBs(p.periodMonth, p.periodYear)
            const paidAd = p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : ''
            const paidBs = p.paymentDate ? formatBsFromAd(p.paymentDate) : ''
            return (
              <FinanceRow
                key={p._id}
                title={`${p.employeeId?.name || 'Employee'} — ${p.periodMonth}/${p.periodYear}${hBs ? ` · ${hBs}` : ''}`}
                meta={`Payment ${p.paymentStatus}${paidAd ? ` | Paid ${paidAd}${paidBs ? ` (${paidBs} BS)` : ''}` : ''} | Transactions ${(p.transactions || []).length}`}
                amount={money(p.finalSalary)}
                status={p.paymentStatus}
                action={(
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => onSlip(p)}>View Slip</Button>
                  </div>
                )}
              />
            )
          })}
          {total === 0 && (
            <EmptyState>
              {list.length > 0
                ? 'No paid payroll yet — completed payments appear here after Pay salary.'
                : 'No payroll history yet.'}
            </EmptyState>
          )}
        </div>
        <PayrollPaginationBar
          page={safePage}
          pageSize={pageSize}
          total={total}
          totalPages={totalPages}
          from={from}
          to={to}
          onPageChange={setPage}
          onPageSizeChange={onPageSizeChange}
        />
      </div>
    </FinancePanel>
  )
}
