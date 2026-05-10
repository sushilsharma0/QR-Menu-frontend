import React, { useEffect, useMemo, useState } from 'react'
import { FiDownload, FiFileText, FiTrash2, FiUser, FiUsers } from 'react-icons/fi'
import Button from '../../../../components/common/Button'
import Select from '../../../../components/common/Select'
import { adPayrollMonthYearToBs } from '../../../../utils/nepaliDateFormat'
import { EmptyState, FinancePanel, FinanceRow, money } from '../FinanceUI'
import PayrollPaginationBar, { PAYROLL_PAGE_SIZES, paginate } from './PayrollPaginationBar'

export default function PayrollRowsSection({
  user,
  items,
  staffDirectory,
  staffPickId,
  setStaffPickId,
  onOpenPicker,
  onEditRow,
  onSlip,
  onPrint,
  onPay,
  onDelete,
}) {
  const list = Array.isArray(items) ? items : []
  const pendingRows = useMemo(
    () => list.filter((p) => p.paymentStatus !== 'paid'),
    [list],
  )
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAYROLL_PAGE_SIZES[0])

  const { slice, totalPages, safePage, from, to, total } = paginate(pendingRows, page, pageSize)

  const staffOptions = useMemo(
    () =>
      staffDirectory
        .filter((e) => e.isActive !== false)
        .map((e) => ({ value: String(e._id), label: e.name })),
    [staffDirectory],
  )

  useEffect(() => {
    if (safePage !== page) setPage(safePage)
  }, [safePage, page])

  useEffect(() => {
    setPage(1)
  }, [items])

  const onPageSizeChange = (next) => {
    setPageSize(next)
    setPage(1)
  }

  return (
    <FinancePanel title="Payroll rows (pending)">
      <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Only <strong>unpaid</strong> payroll appears here. After <strong>Pay salary</strong>, it moves to <strong>Payroll history</strong>. Slip and PDF still work on pending rows below.
      </p>
      {user?.role === 'restaurant' && staffDirectory.length > 0 && (
        <div className="relative mb-5 overflow-hidden rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/50 p-[1px] shadow-md shadow-amber-900/5 dark:border-amber-900/30 dark:from-gray-900 dark:via-gray-900 dark:to-emerald-950/20 dark:shadow-none">
          <div className="rounded-[0.9rem] bg-white/95 px-4 py-4 backdrop-blur-sm dark:bg-gray-900/95 sm:px-5 sm:py-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-600 to-primary-800 text-white shadow-lg shadow-primary-900/20 sm:flex">
                  <FiUsers className="h-6 w-6" aria-hidden />
                </div>
                <div className="min-w-0 w-full sm:max-w-md">
                  <Select
                    label="Jump to employee"
                    hint="Pick a name, then open the editor for this pay period."
                    placeholder="Select employee…"
                    value={staffPickId || ''}
                    onValueChange={(v) => setStaffPickId(v)}
                    options={staffOptions}
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="primary"
                className="h-[42px] shrink-0 px-5 sm:self-end"
                onClick={onOpenPicker}
              >
                <FiUser className="mr-2 h-4 w-4" aria-hidden />
                Open editor
              </Button>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-surface-200 dark:border-gray-800">
        <div className="space-y-2 p-3">
          {slice.map((p) => {
            const rowBs = adPayrollMonthYearToBs(p.periodMonth, p.periodYear)
            return (
              <FinanceRow
                key={p._id}
                title={p.employeeId?.name || 'Employee'}
                meta={`${rowBs ? `${rowBs} BS · ` : ''}Present ${p.presentDays || 0}/${p.workingDays || 0} | Leave/absent ${p.absentDays || 0} | Basic ${money(p.basicSalary)} + allowance ${money(p.allowance)} | Net ${money(p.finalSalary)}`}
                amount={money(p.finalSalary)}
                status={p.paymentStatus}
                action={(
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={() => onEditRow(p)}>
                      <FiUser className="mr-1" /> Edit pay
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => onSlip(p)}>
                      <FiFileText className="mr-1" /> Slip
                    </Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => onPrint(p)}>
                      <FiDownload className="mr-1" /> PDF
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="!text-red-700 dark:!text-red-400"
                      onClick={() => onDelete(p)}
                    >
                      <FiTrash2 className="mr-1" /> Delete
                    </Button>
                    <Button type="button" size="sm" onClick={() => onPay(p._id)}>Pay salary</Button>
                  </div>
                )}
              />
            )
          })}
          {total === 0 && (
            list.length > 0 ? (
              <EmptyState>
                Everyone is paid for this period. Use <strong>Payroll history</strong> below for slips, PDF, and paid records.
              </EmptyState>
            ) : (
              <EmptyState>No payroll generated for this period yet.</EmptyState>
            )
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
