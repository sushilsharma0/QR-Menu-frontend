import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { FiCalendar, FiCreditCard, FiFilter, FiGrid, FiList, FiPlus, FiPrinter, FiSearch } from 'react-icons/fi'
import api from '../../../services/api'
import { postPosPayment } from '../../../services/posApi'
import { usePosAccess } from '../../../hooks/usePosAccess'
import { useSocket } from '../../../hooks/useSocket'
import { posSounds } from '../../../utils/posSounds'
import PosOrderCard, { getCustomerDisplayName } from './PosOrderCard'

const METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'online', label: 'Online' },
  { value: 'credit', label: 'House credit' },
]

export default function PosBilling() {
  const { canBilling, isOwner, employeeRole } = usePosAccess()
  const { socket } = useSocket()
  const [searchParams] = useSearchParams()
  const orderIdParam = searchParams.get('orderId')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [lines, setLines] = useState([{ method: 'cash', amount: '' }])
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [quickRange, setQuickRange] = useState('all')
  const [pageSize, setPageSize] = useState(10)
  const [viewMode, setViewMode] = useState('card')
  const [filterOpen, setFilterOpen] = useState(false)
  const refreshTimerRef = useRef(null)

  const balance = (o) => {
    const paid = Number(o.amountPaidTotal) || 0
    return Math.round((Number(o.grandTotal) - paid) * 100) / 100
  }

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const res = await api.get('/restaurant/customer-orders', {
        params: { paymentStatus: 'pending,partial', limit: 40 },
      })
      const nextOrders = res.data?.data?.orders || []
      setOrders(nextOrders)
      if (orderIdParam) {
        const nextSelected = nextOrders.find((order) => order._id === orderIdParam)
        if (nextSelected) {
          setSelected(nextSelected)
          setLines([{ method: 'cash', amount: String(balance(nextSelected)) }])
        } else {
          if (!silent) toast('That order is already paid or no longer payable.')
          setSelected(null)
        }
      } else if (selected?._id) {
        const nextSelected = nextOrders.find((order) => order._id === selected._id)
        setSelected(nextSelected || null)
      }
    } catch {
      if (!silent) toast.error('Failed to load bills')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [orderIdParam, selected?._id])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (!socket) return undefined

    const refreshRealtime = () => {
      window.clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = window.setTimeout(() => {
        load({ silent: true })
      }, 250)
    }

    const events = [
      'new_order',
      'pos:new_order',
      'order_updated',
      'payment_updated',
      'pos:payment_success',
    ]
    events.forEach((event) => socket.on(event, refreshRealtime))

    return () => {
      window.clearTimeout(refreshTimerRef.current)
      events.forEach((event) => socket.off(event, refreshRealtime))
    }
  }, [load, socket])

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null
    return orders.filter((o) => {
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
  }, [fromDate, orders, search, toDate])

  const visibleOrders = filteredOrders.slice(0, pageSize)

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

  if (!canBilling) return <Navigate to=".." replace />

  const submitPay = async () => {
    if (!selected) return
    const payments = lines
      .filter((l) => l.amount && Number(l.amount) > 0)
      .map((l) => ({ method: l.method, amount: Number(l.amount) }))
    if (!payments.length) {
      toast.error('Enter at least one payment amount')
      return
    }
    try {
      await postPosPayment({ customerOrderId: selected._id, payments })
      posSounds.paymentOk()
      toast.success('Payment saved')
      setSelected(null)
      setLines([{ method: 'cash', amount: '' }])
      load()
    } catch (e) {
      toast.error(e.response?.data?.message || 'Payment failed')
    }
  }

  if (loading) {
    return <div className="flex h-full items-center justify-center text-primary-700">Loading...</div>
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto grid max-w-7xl gap-4 lg:grid-cols-[1fr_420px]">
        <section className="space-y-3">
          <div className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
                  <FiCreditCard className="h-4 w-4" />
                  Billing
                </span>
                <h1 className="mt-3 text-3xl font-black text-gray-950">Open bills</h1>
                <p className="mt-1 text-sm text-gray-500">Select an unpaid order, split tender, then print the receipt.</p>
              </div>
              <button
                type="button"
                onClick={() => setFilterOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white hover:bg-primary-800"
              >
                <FiFilter className="h-4 w-4" />
                Filters
              </button>
            </div>
          </div>

          <div className={viewMode === 'card' ? 'grid grid-cols-1 gap-3 xl:grid-cols-2' : 'grid grid-cols-1 gap-3'}>
            {visibleOrders.map((o) => (
              <PosOrderCard
                key={o._id}
                order={o}
                selected={selected?._id === o._id}
                onSelect={(order) => {
                  setSelected(order)
                  setLines([{ method: 'cash', amount: String(balance(order)) }])
                }}
                action={
                  <span className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white">
                    <FiCreditCard className="h-4 w-4" />
                    Due Rs. {balance(o)}
                  </span>
                }
              />
            ))}
          </div>
          {!visibleOrders.length && (
            <div className="rounded-3xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-gray-500">
              No matching pending payments.
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
          <h2 className="text-xl font-black text-gray-950 dark:text-gray-100">Split payment</h2>
          {!selected && <p className="mt-4 text-sm text-gray-500">Select an order to start payment.</p>}
          {selected && (
            <>
              <div className="mt-4 rounded-2xl bg-primary-50 p-4">
                <p className="text-sm font-semibold text-primary-800">Order #{selected.orderNumber}</p>
                <p className="mt-1 text-3xl font-black text-primary-700">Rs. {balance(selected)}</p>
              </div>
              <div className="mt-4 space-y-2">
                {lines.map((line, idx) => (
                  <div key={idx} className="flex gap-2">
                    <select
                      value={line.method}
                      onChange={(e) => {
                        const next = [...lines]
                        next[idx] = { ...next[idx], method: e.target.value }
                        setLines(next)
                      }}
                      className="flex-1 rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                    >
                      {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <input
                      type="number"
                      value={line.amount}
                      onChange={(e) => {
                        const next = [...lines]
                        next[idx] = { ...next[idx], amount: e.target.value }
                        setLines(next)
                      }}
                      className="w-32 rounded-xl border border-surface-200 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
                      placeholder="Rs."
                    />
                  </div>
                ))}
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-sm font-bold text-primary-700"
                  onClick={() => setLines([...lines, { method: 'cash', amount: '' }])}
                >
                  <FiPlus className="h-4 w-4" />
                  Add tender
                </button>
              </div>
              <button type="button" onClick={submitPay} className="mt-6 w-full rounded-xl bg-primary-600 py-3 text-sm font-bold text-white hover:bg-primary-700">
                Confirm payment
              </button>
              <button type="button" onClick={() => window.print()} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-600 py-2 text-sm font-bold text-primary-700">
                <FiPrinter className="h-4 w-4" />
                Print receipt
              </button>
              <div className="print-only mt-4 hidden text-xs">
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify({ order: selected.orderNumber, paid: lines, staff: isOwner ? 'owner' : employeeRole }, null, 2)}
                </pre>
              </div>
            </>
          )}
        </section>
      </div>

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
            <h2 className="text-xl font-black text-gray-950">Billing filters</h2>
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
            <span className="text-sm font-semibold text-gray-700">Search bills</span>
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
              <div className="mt-1 flex gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-3 text-sm font-bold text-gray-700">
                  <FiCalendar className="h-4 w-4 text-primary-700" /> BS
                </span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value)
                    setQuickRange('custom')
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-surface-200 px-3 py-2.5 text-sm"
                />
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">To date</span>
              <div className="mt-1 flex gap-2">
                <span className="inline-flex items-center gap-2 rounded-xl border border-surface-200 px-3 text-sm font-bold text-gray-700">
                  <FiCalendar className="h-4 w-4 text-primary-700" /> BS
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value)
                    setQuickRange('custom')
                  }}
                  className="min-w-0 flex-1 rounded-xl border border-surface-200 px-3 py-2.5 text-sm"
                />
              </div>
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {[
              ['today', 'Today'],
              ['7d', 'Last 7 days'],
              ['all', 'All time'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setRange(value)}
                className={`rounded-2xl px-4 py-2 text-sm font-black ${quickRange === value ? 'bg-primary-700 text-white' : 'bg-amber-100 text-gray-700 hover:bg-amber-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Page size</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="mt-1 w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
            >
              {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size} bills</option>)}
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
          <button
            type="button"
            onClick={() => {
              setSearch('')
              setFromDate('')
              setToDate('')
              setQuickRange('all')
              setPageSize(10)
              setViewMode('card')
            }}
            className="w-full rounded-xl border border-primary-200 px-4 py-2 text-sm font-black text-primary-700 hover:bg-primary-50"
          >
            Reset filters
          </button>
          <p className="text-sm font-semibold text-gray-500">
            Showing {visibleOrders.length} of {filteredOrders.length} payable orders
          </p>
        </div>
      </section>
    </div>
  )
}
