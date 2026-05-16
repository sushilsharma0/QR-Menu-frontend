import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import toast from '@utils/toast'
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiFilter,
  FiGrid,
  FiList,
  FiMapPin,
  FiRefreshCw,
  FiSearch,
  FiShoppingCart,
  FiTarget,
  FiTrendingUp,
  FiUser,
  FiXCircle,
} from 'react-icons/fi'
import { fetchPosOrders } from '../../../services/posApi'
import { useSocket } from '../../../hooks/useSocket'

const statusTone = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
  preparing: 'bg-violet-50 text-violet-700 border-violet-200',
  cooking: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  served: 'bg-slate-50 text-slate-700 border-slate-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const paymentTone = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  partial: 'bg-blue-50 text-blue-700 border-blue-200',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
}

function Pill({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${className}`}>
      {children}
    </span>
  )
}

function getCustomerDisplayName(order) {
  const name = String(order?.customerName || '').trim()
  const genericNames = new Set(['guest', 'qr customer', 'guest user'])
  if (name && !genericNames.has(name.toLowerCase())) return name
  if (order?.customerPhone) return order.customerPhone
  if (order?.customerEmail) return order.customerEmail
  if (order?.guestId) return order.guestId
  return 'Walk-in Guest'
}

const statusFilters = [
  { value: 'all', label: 'All', icon: FiShoppingCart },
  { value: 'pending', label: 'New', icon: FiClock },
  { value: 'confirmed', label: 'Confirmed', icon: FiCheckCircle },
  { value: 'preparing', label: 'Preparing', icon: FiTrendingUp },
  { value: 'ready', label: 'Ready', icon: FiCheckCircle },
  { value: 'served', label: 'Served', icon: FiCheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: FiXCircle },
]

export default function PosOrdersList() {
  const { posBase } = useOutletContext()
  const { socket } = useSocket()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [quickRange, setQuickRange] = useState('all')
  const [jumpOrder, setJumpOrder] = useState('')
  const [viewMode, setViewMode] = useState('card')
  const [filterOpen, setFilterOpen] = useState(false)
  const refreshTimerRef = useRef(null)

  const load = useCallback(async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true)
      const data = await fetchPosOrders({ limit: 300 })
      setOrders(data.orders || [])
    } catch {
      if (!silent) toast.error('Failed to load POS orders')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

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
    setPageSize(10)
    setStatusFilter('all')
    setPaymentFilter('all')
    setQuickRange('all')
    setJumpOrder('')
    setViewMode('card')
  }

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase()
    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null

    return orders.filter((row) => {
      const o = row.customerOrder
      if (!o) return false

      if (statusFilter !== 'all' && o.status !== statusFilter) return false
      if (paymentFilter === 'paid' && o.paymentStatus !== 'paid') return false
      if (paymentFilter === 'unpaid' && o.paymentStatus === 'paid') return false

      const created = o.createdAt ? new Date(o.createdAt) : null
      if (from && created && created < from) return false
      if (to && created && created > to) return false

      if (q) {
        const haystack = [
          o.orderNumber,
          o.customerName,
          o.customerPhone,
          o.customerEmail,
          o.guestId,
          o.table?.tableNumber,
          o.orderChannel,
          ...(Array.isArray(o.items) ? o.items.map((item) => item.name) : []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [fromDate, orders, paymentFilter, search, statusFilter, toDate])

  const visibleOrders = filteredOrders.slice(0, pageSize)

  const trackOrder = () => {
    const q = jumpOrder.trim().toLowerCase().replace(/^#/, '')
    if (!q) return
    const match = filteredOrders.find((row) =>
      String(row.customerOrder?.orderNumber || '').toLowerCase().includes(q)
    )
    if (!match) {
      toast.error('Order not found in current filters')
      return
    }
    document.getElementById(`pos-order-${match.customerOrder._id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    setFilterOpen(false)
  }

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

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-primary-700">
        Loading orders...
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-7xl space-y-4">
        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-primary-700">
                <FiShoppingCart className="h-4 w-4" />
                POS Orders
              </span>
              <h1 className="mt-3 text-3xl font-black text-gray-950">Order queue</h1>
              <p className="mt-1 text-sm text-gray-500">Review recent POS orders and jump into billing when payment is due.</p>
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
                onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-surface-200 bg-white px-4 py-2 text-sm font-bold text-gray-700 hover:bg-surface-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
              >
                <FiRefreshCw className="h-4 w-4" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
        {!visibleOrders.length && (
          <div className="rounded-3xl border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            No matching POS orders.
          </div>
        )}

        <div className={viewMode === 'card' ? 'grid grid-cols-1 gap-3 xl:grid-cols-2' : 'grid grid-cols-1 gap-3'}>
          {visibleOrders.map((row) => {
            const o = row.customerOrder
            if (!o) return null
            const isPayable = o.paymentStatus === 'pending' || o.paymentStatus === 'partial'
            const items = Array.isArray(o.items) ? o.items : []
            const itemCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
            const createdAt = o.createdAt ? new Date(o.createdAt) : null
            return (
              <article
                id={`pos-order-${o._id}`}
                key={row._id}
                className="rounded-3xl border border-surface-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-black text-gray-950">#{o.orderNumber}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Pill className={statusTone[o.status] || statusTone.pending}>{o.status}</Pill>
                      <Pill className={paymentTone[o.paymentStatus] || paymentTone.pending}>{o.paymentStatus}</Pill>
                      <Pill className="border-surface-200 bg-surface-50 text-gray-600">{o.orderChannel}</Pill>
                      {row.source && <Pill className="border-primary-100 bg-primary-50 text-primary-700">{row.source}</Pill>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-primary-700">Rs. {o.grandTotal}</p>
                    <p className="mt-1 text-xs font-semibold text-gray-500">{itemCount} item{itemCount === 1 ? '' : 's'}</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 text-xs text-gray-600 dark:text-gray-200 sm:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-gray-800">
                    <FiMapPin className="h-4 w-4 text-primary-700" />
                    <span className="truncate">Table {o.table?.tableNumber || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-gray-800">
                    <FiUser className="h-4 w-4 text-primary-700" />
                    <span className="truncate">{getCustomerDisplayName(o)}</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-surface-50 px-3 py-2 dark:bg-gray-800">
                    <FiClock className="h-4 w-4 text-primary-700" />
                    <span className="truncate">{createdAt ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-surface-100 bg-surface-50/70 p-3 dark:border-gray-700 dark:bg-gray-950/70">
                  <div className="space-y-2">
                    {items.slice(0, 4).map((item, idx) => (
                      <div key={`${item.menuItem || item.name}-${idx}`} className="flex items-start justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-bold leading-tight text-gray-900 dark:text-gray-100">
                            {item.quantity}x {item.name}
                          </p>
                          {(item.specialInstructions || item.cookingInstructions) && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                              {item.specialInstructions || item.cookingInstructions}
                            </p>
                          )}
                          {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                              {item.customizations.map((c) => `${c.name}: ${c.value}`).join(', ')}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-black text-primary-700">Rs. {item.subtotal ?? Number(item.price || 0) * Number(item.quantity || 0)}</span>
                      </div>
                    ))}
                    {items.length > 4 && (
                      <p className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-gray-500 dark:bg-gray-900 dark:text-gray-300">
                        +{items.length - 4} more item{items.length - 4 === 1 ? '' : 's'}
                      </p>
                    )}
                    {!items.length && <p className="text-sm text-gray-500">No item details available.</p>}
                  </div>
                </div>

                {(o.specialRequests || o.customerPhone) && (
                  <div className="mt-3 rounded-2xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                    {o.customerPhone && <span className="font-bold">Phone: {o.customerPhone}</span>}
                    {o.customerPhone && o.specialRequests && <span className="mx-2">-</span>}
                    {o.specialRequests && <span>{o.specialRequests}</span>}
                  </div>
                )}

                <div className="mt-4 flex justify-end">
                  {isPayable ? (
                    <Link
                      to={`${posBase}/billing?orderId=${o._id}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2 text-sm font-bold text-white hover:bg-primary-700"
                    >
                      <FiCreditCard className="h-4 w-4" />
                      Pay
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-200">
                      <FiCreditCard className="h-4 w-4" />
                      Paid
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
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
              <h2 className="text-xl font-black text-gray-950">Filters</h2>
            </div>
            <div className="flex items-center gap-3">
              <button type="button" onClick={resetFilters} className="text-sm font-black text-primary-700 hover:text-primary-800">
                Reset
              </button>
              <button
                type="button"
                onClick={() => setFilterOpen(false)}
                className="rounded-xl border border-surface-200 px-3 py-2 text-sm font-black text-gray-700 hover:bg-surface-50"
              >
                Close
              </button>
            </div>
          </div>

          <div className="space-y-5 p-5">
            <div className="grid gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Search orders</span>
                <div className="relative mt-1">
                  <FiSearch className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Order no, customer, phone, email"
                    className="w-full rounded-xl border border-surface-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </label>

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
                    className="min-w-0 flex-1 rounded-xl border border-surface-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
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
                    className="min-w-0 flex-1 rounded-xl border border-surface-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Page size</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-surface-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                >
                  {[10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>{size} orders</option>
                  ))}
                </select>
              </label>

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
                    className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                      quickRange === value
                        ? 'bg-primary-700 text-white'
                        : 'bg-amber-100 text-gray-700 hover:bg-amber-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-200 pb-5">
              <div className="flex flex-wrap gap-2">
                {statusFilters.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setStatusFilter(value)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${
                      statusFilter === value
                        ? 'bg-primary-700 text-white'
                        : 'bg-amber-100 text-gray-700 hover:bg-amber-200'
                    }`}
                  >
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
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPaymentFilter(value)}
                    className={`rounded-2xl px-4 py-2 text-sm font-black transition ${
                      paymentFilter === value
                        ? 'bg-primary-700 text-white'
                        : 'bg-amber-100 text-gray-700 hover:bg-amber-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">Jump to order</span>
                <div className="mt-1 flex gap-2">
                  <input
                    value={jumpOrder}
                    onChange={(e) => setJumpOrder(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') trackOrder()
                    }}
                    placeholder="Exact order number"
                    className="min-w-0 flex-1 rounded-xl border border-surface-200 px-3 py-2.5 text-sm outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-100"
                  />
                  <button
                    type="button"
                    onClick={trackOrder}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-black text-white hover:bg-primary-800"
                  >
                    <FiTarget className="h-4 w-4" />
                    Track Order
                  </button>
                </div>
              </label>

              <div className="inline-flex overflow-hidden rounded-xl border border-amber-200 bg-white">
                <button
                  type="button"
                  onClick={() => setViewMode('card')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-black ${viewMode === 'card' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-amber-50'}`}
                >
                  <FiGrid className="h-4 w-4" />
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-black ${viewMode === 'list' ? 'bg-primary-700 text-white' : 'text-gray-700 hover:bg-amber-50'}`}
                >
                  <FiList className="h-4 w-4" />
                  List
                </button>
              </div>
            </div>

            <p className="text-sm font-semibold text-gray-500">
              Showing {visibleOrders.length} of {filteredOrders.length} matching orders
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
