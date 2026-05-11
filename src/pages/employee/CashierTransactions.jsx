import React, { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiCalendar, FiFilter, FiRefreshCw, FiSearch, FiUser } from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

const METHOD_OPTIONS = [
  { value: '', label: 'All methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'upi', label: 'UPI / Online' },
  { value: 'card', label: 'Card' },
  { value: 'credit', label: 'House credit' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'pending', label: 'Pending' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

function formatStaff(tx) {
  const p = tx?.processedBy
  if (p && typeof p === 'object') {
    return p.name || p.username || p.email || 'Staff'
  }
  return 'Owner / system'
}

const CashierTransactions = () => {
  const navigate = useNavigate()
  const { cashierBase } = useTenantRoutes()
  const { socket } = useSocket()
  const [rows, setRows] = useState([])
  const [summary, setSummary] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 })
  const [loading, setLoading] = useState(true)
  const [method, setMethod] = useState('')
  const [status, setStatus] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 400)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    setPage(1)
  }, [debouncedQ])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = {
        page,
        limit: 25,
      }
      if (method) params.method = method
      if (status) params.status = status
      if (startDate) params.startDate = `${startDate}T00:00:00.000Z`
      if (endDate) params.endDate = `${endDate}T23:59:59.999Z`
      if (debouncedQ) params.q = debouncedQ

      const res = await api.get('/restaurant/cashier/transactions', { params })
      const data = res.data.data
      setRows(data.transactions || [])
      setSummary(data.summary || null)
      setPagination(data.pagination || { page: 1, limit: 25, total: 0, pages: 0 })
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Could not load transactions')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [page, method, status, startDate, endDate, debouncedQ])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!socket) return undefined
    const onUpd = () => load()
    socket.on('payment_updated', onUpd)
    socket.on('order_updated', onUpd)
    return () => {
      socket.off('payment_updated', onUpd)
      socket.off('order_updated', onUpd)
    }
  }, [socket, load])

  const fmt = (n) => `${DEFAULT_CURRENCY_SYMBOL}${Number(n ?? 0).toFixed(2)}`

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50 sm:text-3xl">Transaction history</h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Every successful payment appears here, including tickets closed by other cashiers.
          </p>
        </div>
        <Button type="button" variant="secondary" className="shrink-0 gap-2" onClick={() => load()}>
          <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Successful total</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{fmt(summary.totalRevenue)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Transactions</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{summary.successfulTransactions ?? 0}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Today (amount)</p>
            <p className="mt-1 text-lg font-bold text-emerald-700 dark:text-emerald-400">{fmt(summary.todayAmount)}</p>
          </Card>
          <Card className="!p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Today (count)</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-100">{summary.todayTransactions ?? 0}</p>
          </Card>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-gray-100 bg-surface-50/80 p-4 dark:border-gray-800 dark:bg-gray-900/50 lg:flex-row lg:flex-wrap lg:items-end">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200 lg:w-full">
            <FiFilter className="h-4 w-4" />
            Filters
          </div>
          <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6 lg:gap-4">
            <div className="lg:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Search</label>
              <Input
                icon={FiSearch}
                placeholder="Receipt # or order #"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="py-2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Method</label>
              <select
                value={method}
                onChange={(e) => {
                  setMethod(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {METHOD_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">Status</label>
              <select
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value || 'all-s'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                <FiCalendar className="h-3.5 w-3.5" />
                From
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-600 dark:text-gray-400">To</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  setPage(1)
                }}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          <p className="w-full text-xs text-gray-500 lg:w-auto">Filters apply automatically. Search waits briefly while you type.</p>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">No transactions match your filters.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 dark:bg-gray-900/80">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Time</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Receipt</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Order</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Method</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1">
                      <FiUser className="h-3.5 w-3.5" />
                      Recorded by
                    </span>
                  </th>
                  <th className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((tx) => {
                  const oid = tx.customerOrder?._id || tx.customerOrder
                  const ordNum = tx.customerOrder?.orderNumber
                  return (
                    <tr key={tx._id} className="bg-white dark:bg-gray-950/40">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(tx.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-900 dark:text-gray-100">
                        {tx.receiptNo}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{ordNum || '—'}</td>
                      <td className="px-4 py-3 uppercase text-gray-700 dark:text-gray-300">{tx.paymentMethod}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{fmt(tx.amount)}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{formatStaff(tx)}</td>
                      <td className="px-4 py-3 text-right">
                        {oid ? (
                          <button
                            type="button"
                            onClick={() => navigate(`${cashierBase}/orders/${oid}`)}
                            className="inline-flex items-center gap-1 text-sm font-bold text-primary-600 hover:text-primary-800 dark:text-primary-400"
                          >
                            Bill
                            <FiArrowRight className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {pagination.pages > 1 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 px-4 py-4 sm:flex-row dark:border-gray-800">
            <p className="text-xs text-gray-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      <p className="text-center text-xs text-gray-500 dark:text-gray-500">
        Need to close a ticket?{' '}
        <Link to={`${cashierBase}/dashboard`} className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
          Back to payments
        </Link>
      </p>
    </div>
  )
}

export default CashierTransactions
