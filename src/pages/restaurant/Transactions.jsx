import React, { useState, useEffect, useMemo } from 'react'
import {
  FiRefreshCw, FiDownload, FiTrendingUp, FiTrendingDown,
  FiDollarSign, FiCreditCard, FiActivity, FiCalendar
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'

// ── Helpers
const fmt     = (v) => `Rs. ${Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString()

// ── Recalculate summary state after a new payment event
// Called both from direct API response and socket events
const buildUpdatedSummary = (prev, tx) => {
  if (!prev) return prev
  const amount = Number(tx.amount || 0)
  const txIsToday = isToday(tx.createdAt)
  const isSuccess = tx.status === 'success'

  return {
    ...prev,

    // ── Revenue totals
    totalAmount:            (Number(prev.totalAmount            || 0) + amount),
    totalRevenue:           isSuccess ? (Number(prev.totalRevenue || 0) + amount) : (Number(prev.totalRevenue || 0)),
    todayAmount:            txIsToday && isSuccess ? (Number(prev.todayAmount || 0) + amount) : (Number(prev.todayAmount || 0)),

    // ── Transaction counts
    totalTransactions:      (Number(prev.totalTransactions      || 0) + 1),
    successfulTransactions: isSuccess ? (Number(prev.successfulTransactions || 0) + 1) : (Number(prev.successfulTransactions || 0)),
    pendingTransactions:    tx.status === 'pending' ? (Number(prev.pendingTransactions || 0) + 1) : (Number(prev.pendingTransactions || 0)),
    failedTransactions:     tx.status === 'failed'  ? (Number(prev.failedTransactions || 0) + 1) : (Number(prev.failedTransactions || 0)),
    refundedTransactions:   tx.status === 'refunded'? (Number(prev.refundedTransactions || 0) + 1) : (Number(prev.refundedTransactions || 0)),
    todayTransactions:      txIsToday ? (Number(prev.todayTransactions || 0) + 1) : (Number(prev.todayTransactions || 0)),

    // ── Average ticket — recalculated from new totals
    averageAmount: (
      (Number(prev.totalAmount || 0) + amount) /
      (Number(prev.totalTransactions || 0) + 1)
    ),

    // ── Per-method counts
    byCash:   tx.paymentMethod === 'cash'   ? (prev.byCash   || 0) + 1 : (prev.byCash   || 0),
    byCard:   tx.paymentMethod === 'card'   ? (prev.byCard   || 0) + 1 : (prev.byCard   || 0),
    byUpi:    tx.paymentMethod === 'upi'    ? (prev.byUpi    || 0) + 1 : (prev.byUpi    || 0),
    byOnline: tx.paymentMethod === 'online' ? (prev.byOnline || 0) + 1 : (prev.byOnline || 0),
    byWallet: tx.paymentMethod === 'wallet' ? (prev.byWallet || 0) + 1 : (prev.byWallet || 0),
  }
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function MetricCard({ label, value, sub, icon: Icon, color }) {
  const colors = {
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100  text-green-600',  text: 'text-green-600'  },
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100   text-blue-600',   text: 'text-blue-600'   },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' },
  }
  const c = colors[color] || colors.blue

  return (
    <div className={`${c.bg} rounded-2xl p-5 border border-white flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${c.icon}`}>
          <Icon size={18} />
        </div>
      </div>
      <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function MethodBadge({ method }) {
  const styles = {
    cash:   'bg-green-100  text-green-800',
    card:   'bg-blue-100   text-blue-800',
    online: 'bg-purple-100 text-purple-800',
    upi:    'bg-indigo-100 text-indigo-800',
    wallet: 'bg-yellow-100 text-yellow-800',
  }
  return (
    <span className={`px-2 py-1 text-xs rounded-full capitalize font-medium ${styles[method] || styles.cash}`}>
      {method}
    </span>
  )
}

function StatusBadge({ status }) {
  const styles = {
    success:  'bg-green-100  text-green-800',
    pending:  'bg-yellow-100 text-yellow-800',
    failed:   'bg-red-100    text-red-800',
    refunded: 'bg-gray-100   text-gray-800',
  }
  return (
    <span className={`px-2 py-1 text-xs rounded-full capitalize font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  )
}

function MethodBreakdown({ summary }) {
  const methods = [
    { label: 'Cash',   color: 'bg-green-500',  count: summary.byCash   || 0 },
    { label: 'Card',   color: 'bg-blue-500',   count: summary.byCard   || 0 },
    { label: 'UPI',    color: 'bg-indigo-500', count: summary.byUpi    || 0 },
    { label: 'Online', color: 'bg-purple-500', count: summary.byOnline || 0 },
    { label: 'Wallet', color: 'bg-yellow-500', count: summary.byWallet || 0 },
  ]
  const total = methods.reduce((s, m) => s + m.count, 0) || 1

  return (
    <div className="space-y-3">
      {methods.map(m => (
        <div key={m.label} className="flex items-center gap-3">
          <span className="text-xs text-gray-500 w-12 shrink-0">{m.label}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className={`${m.color} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${(m.count / total) * 100}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-gray-700 w-6 text-right">{m.count}</span>
        </div>
      ))}
    </div>
  )
}

function StatusBreakdown({ summary }) {
  const statuses = [
    { label: 'Success',  count: summary.successfulTransactions || 0, color: 'text-green-600',  dot: 'bg-green-500'  },
    { label: 'Pending',  count: summary.pendingTransactions    || 0, color: 'text-yellow-600', dot: 'bg-yellow-400' },
    { label: 'Failed',   count: summary.failedTransactions     || 0, color: 'text-red-600',    dot: 'bg-red-500'    },
    { label: 'Refunded', count: summary.refundedTransactions   || 0, color: 'text-gray-600',   dot: 'bg-gray-400'   },
  ]
  return (
    <div className="grid grid-cols-2 gap-3">
      {statuses.map(s => (
        <div key={s.label} className="flex items-center gap-2 bg-gray-50 px-3 py-2.5 rounded-xl">
          <div className={`w-2 h-2 rounded-full ${s.dot} shrink-0`} />
          <div>
            <p className={`text-sm font-bold ${s.color}`}>{s.count}</p>
            <p className="text-[10px] text-gray-400">{s.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function exportCSV(transactions) {
  if (!transactions.length) { toast.error('No transactions to export'); return }
  const headers = ['Receipt No', 'Order No', 'Amount', 'Method', 'Status', 'Date']
  const rows = transactions.map(tx => [
    tx.receiptNo,
    tx.customerOrder?.orderNumber || tx.order?.orderNumber || 'N/A',
    Number(tx.amount || 0).toFixed(2),
    tx.paymentMethod,
    tx.status,
    fmtDate(tx.createdAt),
  ])
  const csv  = [headers, ...rows].map(r => r.join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `transactions_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  URL.revokeObjectURL(url)
  toast.success('CSV exported!')
}

// ─────────────────────────────────────────────
// Main Transactions page
// ─────────────────────────────────────────────
const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary]           = useState({})
  const [loading, setLoading]           = useState(true)
  const [filters, setFilters]           = useState({ method: '', status: '', startDate: '', endDate: '' })
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const PER_PAGE                        = 10
  const { socket }                      = useSocket()

  useEffect(() => { fetchTransactions() }, [filters])

  // ── Real-time socket updates
  useEffect(() => {
    if (!socket) return

    const handlePaymentUpdated = (newTx) => {
      // Prepend to transaction list — avoid duplicates
      setTransactions(prev => {
        const exists = prev.some(tx => tx._id === newTx._id)
        return exists ? prev : [newTx, ...prev]
      })

      // Update summary totals immediately without refetch
      setSummary(prev => buildUpdatedSummary(prev, newTx))
    }

    socket.on('payment_updated', handlePaymentUpdated)
    socket.on('order_updated',   handlePaymentUpdated)

    return () => {
      socket.off('payment_updated', handlePaymentUpdated)
      socket.off('order_updated',   handlePaymentUpdated)
    }
  }, [socket])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = {}
      if (filters.method)    params.method    = filters.method
      if (filters.status)    params.status    = filters.status
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate)   params.endDate   = filters.endDate

      const res = await api.get('/restaurant/cashier/transactions', { params })
      setTransactions(res.data.data.transactions)
      setSummary(res.data.data.summary)
    } catch {
      toast.error('Failed to fetch transactions')
    } finally {
      setLoading(false)
    }
  }

  // ── Called from payment form after successful POST
  const handlePaymentSuccess = (newTx) => {
    // Prepend new transaction immediately
    setTransactions(prev => [newTx, ...prev])

    // Update all summary numbers instantly
    setSummary(prev => buildUpdatedSummary(prev, newTx))

    toast.success('Payment recorded successfully')
  }

  const clearFilters = () => {
    setFilters({ method: '', status: '', startDate: '', endDate: '' })
    setSearch('')
    setPage(1)
  }

  // Client-side search across visible columns
  const searched = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return transactions
    return transactions.filter(tx =>
      tx.receiptNo?.toLowerCase().includes(q) ||
      (tx.customerOrder?.orderNumber || tx.order?.orderNumber || '').toLowerCase().includes(q) ||
      tx.paymentMethod?.toLowerCase().includes(q) ||
      tx.status?.toLowerCase().includes(q)
    )
  }, [transactions, search])

  // Client-side pagination
  const totalPages    = Math.ceil(searched.length / PER_PAGE) || 1
  const paginated     = searched.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const activeFilters = Object.values(filters).filter(Boolean).length

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">View and manage all payment transactions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => exportCSV(searched)}>
            <FiDownload className="mr-2" /> Export CSV
          </Button>
          <Button variant="secondary" onClick={fetchTransactions}>
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary Metric Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Total Revenue"
            value={fmt(summary.totalRevenue ?? summary.totalAmount)}
            sub="All successful payments"
            icon={FiDollarSign}
            color="green"
          />
          <MetricCard
            label="Today's Revenue"
            value={fmt(summary.todayAmount)}
            sub={`${summary.todayTransactions || 0} transactions today`}
            icon={FiCalendar}
            color="orange"
          />
          <MetricCard
            label="Total Transactions"
            value={summary.totalTransactions || 0}
            sub={`${summary.successfulTransactions || 0} successful`}
            icon={FiActivity}
            color="blue"
          />
          <MetricCard
            label="Avg. Ticket Size"
            value={fmt(summary.averageAmount)}
            sub="Per transaction"
            icon={FiCreditCard}
            color="purple"
          />
        </div>
      )}

      {/* ── Breakdown Cards */}
      {summary && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card title="Payment Method Breakdown">
            <MethodBreakdown summary={summary} />
          </Card>
          <Card title="Transaction Status">
            <StatusBreakdown summary={summary} />
          </Card>
        </div>
      )}

      {/* ── Filters */}
      <Card title="Filters">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={filters.method}
              onChange={(e) => { setFilters(f => ({ ...f, method: e.target.value })); setPage(1) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
              <option value="upi">UPI</option>
              <option value="wallet">Wallet</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1) }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        {activeFilters > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-red-500 font-semibold hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </Card>

      {/* ── Transactions Table */}
      <Card title={`Transactions (${searched.length})`}>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by receipt no, order no, method, status..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Receipt No', 'Order', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginated.map((tx) => (
                <tr key={tx._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {tx.receiptNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {tx.customerOrder?.orderNumber || tx.order?.orderNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {fmt(tx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <MethodBadge method={tx.paymentMethod} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {fmtDate(tx.createdAt)}
                  </td>
                </tr>
              ))}

              {paginated.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <FiActivity size={32} className="text-gray-300" />
                      <p className="font-medium">No transactions found</p>
                      {(activeFilters > 0 || search) && (
                        <button
                          onClick={clearFilters}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, searched.length)} of {searched.length}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                .reduce((acc, n, i, arr) => {
                  if (i > 0 && n - arr[i - 1] > 1) acc.push('...')
                  acc.push(n)
                  return acc
                }, [])
                .map((n, i) =>
                  n === '...' ? (
                    <span key={`ellipsis-${i}`} className="px-2 py-1.5 text-sm text-gray-400">…</span>
                  ) : (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`px-3 py-1.5 text-sm border rounded-lg ${
                        page === n
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )
              }
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

export default Transactions