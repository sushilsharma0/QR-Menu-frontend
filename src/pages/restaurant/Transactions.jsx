import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  FiRefreshCw, FiDownload, FiTrendingUp, FiTrendingDown,
  FiCreditCard, FiActivity, FiCalendar, FiX, FiClock, FiInfo
} from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import { useSocket } from '../../hooks/useSocket'
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantCurrency,
  formatRestaurantDateTime,
  paymentMethodStyles,
  paymentStatusStyles,
} from '../../components/restaurant/RestaurantUI'

// ── Helpers
const isToday = (dateStr) => new Date(dateStr).toDateString() === new Date().toDateString()

// ── Recalculate summary state after a new payment event
// Called both from direct API response and socket events
const normalizeSocketTx = (payload) => {
  if (!payload) return null
  const id = payload._id || payload.transactionId
  if (!id || payload.amount == null) return null
  return {
    _id: id,
    receiptNo: payload.receiptNo || '',
    amount: Number(payload.amount),
    paymentMethod: payload.paymentMethod || 'cash',
    status: payload.status || 'success',
    createdAt: payload.createdAt || new Date().toISOString(),
    customerOrder: payload.customerOrder,
    order: payload.order,
  }
}

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
  return <RestaurantStatusPill value={method} styles={paymentMethodStyles} />
}

function StatusBadge({ status }) {
  return <RestaurantStatusPill value={status} styles={paymentStatusStyles} />
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
    formatRestaurantDateTime(tx.createdAt),
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

// ── Transaction Detail Modal
function TransactionDetail({ transaction, onClose, onRefunded }) {
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)

  if (!transaction) return null

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Please enter a refund reason')
      return
    }
    
    try {
      setRefunding(true)
      await api.post(`/restaurant/cashier/transactions/${transaction._id}/refund`, {
        reason: refundReason
      })
      toast.success('Transaction refunded successfully')
      onClose()
      onRefunded?.()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to refund transaction')
    } finally {
      setRefunding(false)
    }
  }

  const order = transaction.customerOrder || transaction.order
  const processedByName = transaction.processedBy?.name || 'System'
  const refundedByName = transaction.refundedBy?.name || 'N/A'

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Transaction Details</h2>
            <p className="text-sm text-gray-500 mt-1">{transaction.receiptNo}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-lg transition">
            <FiX size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Receipt Number</p>
                <p className="text-sm font-semibold text-gray-900">{transaction.receiptNo}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Amount</p>
                <p className="text-sm font-semibold text-gray-900">{formatRestaurantCurrency(transaction.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Payment Method</p>
                <p className="text-sm font-semibold text-gray-900 capitalize">{transaction.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Status</p>
                <StatusBadge status={transaction.status} />
              </div>
            </div>
          </div>

          {/* Order Information */}
          {order && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <p className="text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
                <FiInfo size={14} /> Order Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Order Number</p>
                  <p className="text-sm font-semibold text-gray-900">{order.orderNumber}</p>
                </div>
                {transaction.customerOrder && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Customer Name</p>
                      <p className="text-sm font-semibold text-gray-900">{transaction.customerOrder.customerName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Order Status</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{transaction.customerOrder.status || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payment Status</p>
                      <p className="text-sm font-semibold text-gray-900 capitalize">{transaction.customerOrder.paymentStatus || 'N/A'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Refund Information */}
          {transaction.refunded && (
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-xs text-gray-500 uppercase mb-3 flex items-center gap-2">
                <FiX size={14} /> Refund Information
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Refund Amount</p>
                  <p className="text-sm font-semibold text-gray-900">{formatRestaurantCurrency(transaction.refundAmount || transaction.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Refund Date</p>
                  <p className="text-sm font-semibold text-gray-900">{formatRestaurantDateTime(transaction.refundedAt)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Refund Reason</p>
                  <p className="text-sm font-semibold text-gray-900">{transaction.refundReason || 'No reason provided'}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Refunded By</p>
                  <p className="text-sm font-semibold text-gray-900">{refundedByName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status History */}
          {transaction.statusHistory && transaction.statusHistory.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 uppercase flex items-center gap-2">
                <FiClock size={14} /> Transaction History
              </p>
              <div className="relative">
                {transaction.statusHistory.map((history) => (
                  <div key={`${history.status}-${history.createdAt || history.updatedAt || history.note || history.reason}`} className="flex gap-4">
                    {/* Timeline dot and line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        history.status === 'success' ? 'bg-green-500' :
                        history.status === 'refunded' ? 'bg-red-500' :
                        history.status === 'pending' ? 'bg-yellow-500' :
                        'bg-gray-400'
                      }`} />
                      {idx < transaction.statusHistory.length - 1 && (
                        <div className="w-0.5 h-12 bg-gray-200" />
                      )}
                    </div>
                    {/* Content */}
                    <div className="pb-6">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm font-semibold text-gray-900 capitalize">{history.status}</p>
                        <p className="text-xs text-gray-500">{formatRestaurantDateTime(history.timestamp)}</p>
                      </div>
                      {history.note && (
                        <p className="text-sm text-gray-600 mt-1">{history.note}</p>
                      )}
                      {history.updatedBy && (
                        <p className="text-xs text-gray-500 mt-1">By: {history.updatedBy.name || 'System'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Info */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 text-xs text-gray-600 space-y-2">
            <div className="flex justify-between">
              <span>Processed By:</span>
              <span className="font-semibold">{processedByName}</span>
            </div>
            <div className="flex justify-between">
              <span>Created At:</span>
              <span className="font-semibold">{formatRestaurantDateTime(transaction.createdAt)}</span>
            </div>
            {transaction.notes && (
              <div className="flex justify-between">
                <span>Notes:</span>
                <span className="font-semibold">{transaction.notes}</span>
              </div>
            )}
          </div>

          {/* Refund Form */}
          {transaction.status === 'success' && !transaction.refunded && (
            <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 space-y-3">
              <p className="text-xs text-gray-500 uppercase font-semibold">Refund This Transaction</p>
              <textarea
                placeholder="Enter refund reason (required)..."
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
              />
              <Button 
                onClick={handleRefund} 
                variant="danger"
                disabled={refunding || !refundReason.trim()}
                className="w-full"
              >
                {refunding ? 'Processing...' : 'Process Refund'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}// ─────────────────────────────────────────────
// Main Transactions page
// ─────────────────────────────────────────────
const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary]           = useState({})
  const [loading, setLoading]           = useState(true)
  const [filters, setFilters]           = useState({ method: '', status: '', startDate: '', endDate: '' })
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const PER_PAGE                        = 10
  const { socket }                      = useSocket()
  const hasLoadedTransactionsRef        = useRef(false)

  const fetchTransactions = useCallback(async (quiet = false) => {
    try {
      if (quiet || hasLoadedTransactionsRef.current) {
        setLoading(false)
      } else {
        setLoading(true)
      }
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
      hasLoadedTransactionsRef.current = true
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  // ── Real-time socket updates
  useEffect(() => {
    if (!socket) return

    const handlePaymentUpdated = (payload) => {
      const newTx = normalizeSocketTx(payload)
      if (!newTx) return

      setTransactions((prev) => {
        const exists = prev.some((tx) => String(tx._id) === String(newTx._id))
        return exists ? prev : [newTx, ...prev]
      })

      setSummary((prev) => buildUpdatedSummary(prev, newTx))
    }

    const handleOrderUpdated = () => {
      fetchTransactions(true)
    }

    socket.on('payment_updated', handlePaymentUpdated)
    socket.on('order_updated', handleOrderUpdated)

    return () => {
      socket.off('payment_updated', handlePaymentUpdated)
      socket.off('order_updated', handleOrderUpdated)
    }
  }, [socket, fetchTransactions])

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
    return <RestaurantPageLoader />
  }

  return (
    <div className="space-y-6">

      {/* ── Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Transactions</h1>
          <p className="text-gray-500 mt-1">View and manage all payment transactions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => exportCSV(searched)}>
            <FiDownload className="mr-2" /> Export CSV
          </Button>
          <Button variant="secondary" onClick={() => fetchTransactions(true)}>
            <FiRefreshCw className="mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {/* ── Summary Metric Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Total Revenue"
            value={formatRestaurantCurrency(summary.totalRevenue ?? summary.totalAmount)}
            sub="All successful payments"
            icon={TbCurrencyRupee}
            color="green"
          />
          <MetricCard
            label="Today's Revenue"
            value={formatRestaurantCurrency(summary.todayAmount)}
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
            value={formatRestaurantCurrency(summary.averageAmount)}
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
            <label htmlFor="transaction-method-filter" className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              id="transaction-method-filter"
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
            <label htmlFor="transaction-status-filter" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              id="transaction-status-filter"
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
          <Input
            label="Start Date"
            type="date"
            value={filters.startDate}
            onChange={(e) => { setFilters(f => ({ ...f, startDate: e.target.value })); setPage(1) }}
          />
          <Input
            label="End Date"
            type="date"
            value={filters.endDate}
            onChange={(e) => { setFilters(f => ({ ...f, endDate: e.target.value })); setPage(1) }}
          />
        </div>
        {activeFilters > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {activeFilters} filter{activeFilters > 1 ? 's' : ''} active
            </span>
            <button
              type="button"
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
                <tr key={tx._id} onClick={() => setSelectedTransaction(tx)} className="hover:bg-blue-50 transition-colors cursor-pointer">
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {tx.receiptNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {tx.customerOrder?.orderNumber || tx.order?.orderNumber || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                    {formatRestaurantCurrency(tx.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <MethodBadge method={tx.paymentMethod} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                    {formatRestaurantDateTime(tx.createdAt)}
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
                          type="button"
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
                type="button"
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
                      type="button"
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
                type="button"
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

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetail 
          transaction={selectedTransaction} 
          onClose={() => setSelectedTransaction(null)} 
          onRefunded={() => fetchTransactions(true)}
        />
      )}
    </div>
  )
}

export default Transactions
