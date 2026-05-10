import React from 'react'
import Button from '../../../../components/common/Button'
import Select from '../../../../components/common/Select'

export const PAYROLL_PAGE_SIZES = [10, 25, 50, 100]

/** @returns {{ slice: T[], totalPages: number, safePage: number, total: number, from: number, to: number }} */
export function paginate(items, page, pageSize) {
  const list = Array.isArray(items) ? items : []
  const n = list.length
  const totalPages = Math.max(1, Math.ceil(n / pageSize) || 1)
  const safePage = Math.min(Math.max(1, page), totalPages)
  const start = (safePage - 1) * pageSize
  const slice = list.slice(start, start + pageSize)
  return {
    slice,
    totalPages,
    safePage,
    total: n,
    from: n === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, n),
  }
}

export default function PayrollPaginationBar({
  page,
  pageSize,
  total,
  totalPages,
  from,
  to,
  onPageChange,
  onPageSizeChange,
  className = '',
}) {
  if (total === 0) return null

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 border-t border-surface-200 bg-surface-50/50 px-3 py-2.5 text-sm dark:border-gray-800 dark:bg-gray-950/40 ${className}`}
    >
      <p className="text-gray-600 dark:text-gray-400">
        <span className="tabular-nums">
          {from}–{to}
        </span>
        <span className="mx-1">of</span>
        <span className="font-medium tabular-nums text-gray-800 dark:text-gray-200">{total}</span>
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="hidden text-xs text-gray-600 dark:text-gray-400 sm:inline">Per page</span>
          <div className="w-[4.5rem] shrink-0">
            <Select
              size="sm"
              value={pageSize}
              onValueChange={(v) => onPageSizeChange(Number(v))}
              aria-label="Rows per page"
              showLabel={false}
              options={PAYROLL_PAGE_SIZES.map((s) => ({ value: s, label: String(s) }))}
              className="!py-1.5 font-semibold"
            />
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Prev
          </Button>
          <span className="min-w-[5.5rem] px-1 text-center text-xs font-medium tabular-nums text-gray-700 dark:text-gray-300">
            {page} / {totalPages}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
