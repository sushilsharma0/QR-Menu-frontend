import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiFilter,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiSearch,
  FiShoppingCart,
  FiXCircle,
} from 'react-icons/fi'
import api from '../../../services/api'
import { useSocket } from '../../../hooks/useSocket'
import PosOrderCard, { getCustomerDisplayName } from './PosOrderCard'

const statusFilters = [
  { value: 'all', label: 'All', icon: FiShoppingCart },
  { value: 'served', label: 'Served', icon: FiCheckCircle },
  { value: 'completed', label: 'Completed', icon: FiCheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: FiXCircle },
]

export default function PosHistory() {
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [quickRange, setQuickRange] = useState('all')
  const [viewMode, setViewMode] = useState('card')
  const [filterOpen, setFilterOpen] = useState(false)
  const refreshTimerRef = useRef(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const res = await api.get('/restaurant/customer-orders', {
        params: { status: 'completed,served,cancelled', limit: 300 },
      })
      setOrders(res.data?.data?.orders || [])
    } catch {
      if (!silent) toast.error('Failed to load history')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!socket) return undefined
    const refreshRealtime = () => {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = window.setTimeout(() => load({ silent: true }), 250)
    }
    const events = ['order_updated', 'payment_updated', 'pos:payment_success']
    events.forEach((event) => socket.on(event, refreshRealtime))
    return () => {
      window.clearTimeout(refreshTimerRef.current)
      events.forEach((event) => socket.off(event, refreshRealtime))
    }
  }, [load, socket])

  const setRange = (range) => {
    setQuickRange(range)
    const today = new Date()
    const iso = (date) => date.toISOString().slice(0, 10)
    if (range === 'today') {
      const value = iso(today)
      setFromDate(value)
      setToDate(value)
      return
    }
    if (range === '7d') {
      const start = new Date(today)
      start.setDate(today.getDate() - 6)
      setFromDate(iso(start))
      setToDate(iso(today))
      return
    }
    setFromDate('')
    setToDate('')
  }

  const resetFilters = () => {
    setSearch('')
    setFromDate('')
    setToDate('')
    setPageSize(20)
    setStatusFilter('all')
    setPaymentFilter('all')
    setQuickRange('all')
    setViewMode('card')
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null

    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (paymentFilter === 'paid' && o.paymentStatus !== 'paid') return false
      if (paymentFilter === 'unpaid' && o.paymentStatus === 'paid') return false
      const created = o.createdAt ? new Date(o.createdAt) : null
      if (from && created && created < from) return false
      if (to && created && created > to) return false
      if (!q) return true
      const haystack = [
        o.orderNumber,
        getCustomerDisplayName(o),
        o.customerPhone,
        o.customerEmail,
        o.guestId,
        o.table?.tableNumber,
        o.orderChannel,
        ...(Array.isArray(o.items) ? o.items.map((item) => item.name) : []),
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(q)
    })
  }, [fromDate, orders, paymentFilter, search, statusFilter, toDate])

  const visibleOrders = filteredOrders.slice(0, pageSize)

  if (loading) return <div className="flex h-full items-center justify-center text-primary-700">Loading...</div>

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
                <FiClock className="h-4 w-4" />
                History
              </span>
              <h1 className="mt-3 text-3xl font-black text-gray-950">Customer history</h1>
              <p className="mt-1 text-sm text-gray-500">Completed, served, and cancelled POS orders for quick lookup.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white hover:bg-primary-800"
              >
                <FiFilter className="h-4 w-4" />
                Filters
              </button>
              <button
                type="button"
                onClick={() => load()}
                className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-surface-50"
              >
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <div className={viewMode === 'card' ? 'grid grid-cols-1 gap-3 xl:grid-cols-2' : 'grid grid-cols-1 gap-3'}>
          {visibleOrders.map((o) => (
            <PosOrderCard key={o._id} order={o} />
          ))}
        </div>

        {!visibleOrders.length && (
          <div className="rounded-3xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-gray-500">
            No matching history orders.
          </div>
        )}

        {filterOpen && (
          <button
            type="button"
            className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm"
            onClick={() => setFilterOpen(false)}
            aria-label="Close filters"
          />
        )}
        <section
          className={`fixed inset-y-0 right-0 z-[80] w-full max-w-[430px] overflow-y-auto border-l border-surface-200 bg-white shadow-2xl shadow-slate-950/25 transition-transform duration-300 ${
            filterOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          aria-hidden={!filterOpen}
        >
          <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <FiFilter className="h-5 w-5 text-primary-700" />
              <h2 className="text-xl font-black text-gray-950">History filters</h2>
            </div>
            <button
              type="button"
              onClick={() => setFilterOpen(false)}
              className="rounded-xl border border-surface-200 px-3 py-2 text-sm font-black text-gray-700 hover:bg-surface-50"
            >
              Close
            </button>
          </div>
          <div className="space-y-5 p-5">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Search history</span>
              <div className="relative mt-1">
                <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Order no, customer, phone, item"
                  className="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                />
              </div>
            </label>

            <div className="grid grid-cols-1 gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">From date</span>
                <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setQuickRange('custom') }} className="mt-1 w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm" />
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">To date</span>
                <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setQuickRange('custom') }} className="mt-1 w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm" />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ['today', 'Today'],
                ['7d', 'Last 7 days'],
                ['all', 'All time'],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setRange(value)} className={`rounded-2xl px-4 py-2 text-sm font-black ${quickRange === value ? 'bg-primary-700 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {statusFilters.map(({ value, label, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setStatusFilter(value)} className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black ${statusFilter === value ? 'bg-primary-700 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                ['all', 'All payments'],
                ['paid', 'Paid'],
                ['unpaid', 'Unpaid'],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setPaymentFilter(value)} className={`rounded-2xl px-4 py-2 text-sm font-black ${paymentFilter === value ? 'bg-primary-700 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Page size</span>
              <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm">
                {[20, 50, 100, 200].map((size) => <option key={size} value={size}>{size} orders</option>)}
              </select>
            </label>

            <div className="inline-flex overflow-hidden rounded-xl border border-amber-200 bg-white">
              <button type="button" onClick={() => setViewMode('card')} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-black ${viewMode === 'card' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-amber-50'}`}>
                <FiGrid className="h-4 w-4" /> Card
              </button>
              <button type="button" onClick={() => setViewMode('list')} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-black ${viewMode === 'list' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-amber-50'}`}>
                <FiList className="h-4 w-4" /> List
              </button>
            </div>

            <button type="button" onClick={resetFilters} className="w-full rounded-xl border border-primary-200 px-4 py-2 text-sm font-black text-primary-700 hover:bg-primary-50">
              Reset filters
            </button>
            <p className="text-sm font-semibold text-gray-500">
              Showing {visibleOrders.length} of {filteredOrders.length} history orders
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
