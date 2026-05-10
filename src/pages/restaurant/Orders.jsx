import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiEye,
  FiFilter,
  FiGrid,
  FiList,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTrendingUp,
  FiXCircle,
} from 'react-icons/fi'
import toast from 'react-hot-toast'
import api from '../../services/api'
import Button from '../../components/common/Button'
import Card from '../../components/common/Card'
import Input from '../../components/common/Input'
import OrderStatusBadge from '../../components/restaurant/OrderStatusBadge'
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantCurrency,
  formatRestaurantDateTime,
  paymentStatusStyles,
} from '../../components/restaurant/RestaurantUI'
import { useAuth } from '../../hooks/useAuth'
import { useSocket } from '../../hooks/useSocket'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'

const STATUS_FILTERS = [
  { value: 'all', label: 'All', icon: FiShoppingBag },
  { value: 'pending', label: 'New', icon: FiClock },
  { value: 'confirmed', label: 'Confirmed', icon: FiCheckCircle },
  { value: 'preparing', label: 'Preparing', icon: FiTrendingUp },
  { value: 'ready', label: 'Ready', icon: FiCheckCircle },
  { value: 'served', label: 'Served', icon: FiCheckCircle },
  { value: 'cancelled', label: 'Cancelled', icon: FiXCircle },
]

const PAYMENT_FILTERS = [
  { value: 'all', label: 'All payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'pending', label: 'Unpaid' },
]

const filterButtonClass = (active) =>
  `inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
    active
      ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
      : 'border-surface-200 bg-surface-100 text-gray-600 hover:border-surface-300 hover:bg-surface-200'
  }`

const STATUS_ACTIONS = {
  pending: [{ label: 'Confirm', next: 'confirmed', variant: 'success', wait: 15 }],
  confirmed: [{ label: 'Start Preparing', next: 'preparing', variant: 'primary' }],
  preparing: [{ label: 'Mark Ready', next: 'ready', variant: 'primary' }],
  ready: [{ label: 'Serve', next: 'served', variant: 'success' }],
}

function getOrderCustomerLabel(order) {
  const name = String(order?.customerName || '').trim()
  if (order?.guestId && (!name || name.toLowerCase() === 'guest' || name.toLowerCase() === 'qr customer')) {
    return order.guestId
  }
  return name || order?.guestId || 'Guest'
}

function formatDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function defaultToday() {
  return formatDateInputValue(new Date())
}

function defaultWeekStart() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return formatDateInputValue(d)
}

function MetricTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-surface-200 bg-white/90 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

function OrderActionButtons({ order, onUpdate, onView }) {
  const actions = STATUS_ACTIONS[order.status] || []

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="secondary" onClick={onView}>
        <FiEye className="mr-1" /> Details
      </Button>
      {actions.map((action) => (
        <Button
          key={action.next}
          size="sm"
          variant={action.variant}
          onClick={() => onUpdate(order._id, action.next, action.wait)}
        >
          {action.label}
        </Button>
      ))}
      {['pending', 'confirmed', 'preparing'].includes(order.status) && (
        <Button size="sm" variant="danger" onClick={() => onUpdate(order._id, 'cancelled')}>
          Cancel
        </Button>
      )}
    </div>
  )
}

function PaginationBar({ pagination, onPageChange }) {
  const current = Number(pagination.page || 1)
  const totalPages = Math.max(1, Number(pagination.pages || 1))
  const total = Number(pagination.total || 0)
  const limit = Number(pagination.limit || 10)
  const start = total === 0 ? 0 : (current - 1) * limit + 1
  const end = Math.min(current * limit, total)
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === totalPages || Math.abs(number - current) <= 1,
  )

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-surface-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{start}-{end}</span> of{' '}
        <span className="font-semibold text-gray-900">{total}</span> orders
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={current <= 1}
          onClick={() => onPageChange(current - 1)}
        >
          Prev
        </Button>
        <div className="flex items-center gap-1">
          {pages.map((number, index) => {
            const previous = pages[index - 1]
            const showGap = previous && number - previous > 1
            return (
              <React.Fragment key={number}>
                {showGap && <span className="px-1 text-sm text-gray-400">...</span>}
                <button
                  type="button"
                  onClick={() => onPageChange(number)}
                  className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold transition ${
                    number === current
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'border border-surface-200 bg-white text-gray-600 hover:bg-surface-50'
                  }`}
                >
                  {number}
                </button>
              </React.Fragment>
            )
          })}
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={current >= totalPages}
          onClick={() => onPageChange(current + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

const Orders = () => {
  const navigate = useNavigate()
  const { restaurantBase } = useTenantRoutes()
  const { socket } = useSocket()
  const { user } = useAuth()
  const currency = user?.currency || 'Rs.'
  const [orders, setOrders] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0, limit: 10 })
  const [viewMode, setViewMode] = useState('list')
  const [trackOrderNumber, setTrackOrderNumber] = useState('')
  const hasLoadedOrdersRef = useRef(false)

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/restaurant/customer-orders/stats')
      setSummary(res.data.data)
    } catch {
      setSummary(null)
    }
  }, [])

  const fetchOrders = useCallback(async (quiet = false) => {
    try {
      if (quiet || hasLoadedOrdersRef.current) setRefreshing(true)
      else setLoading(true)

      const res = await api.get('/restaurant/customer-orders', {
        params: {
          status: filter !== 'all' ? filter : undefined,
          paymentStatus: paymentFilter !== 'all' ? paymentFilter : undefined,
          search: search || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          page,
          limit,
        },
      })
      setOrders(res.data.data.orders || [])
      setPagination(res.data.data.pagination || { page: 1, pages: 1, total: 0, limit })
    } catch (error) {
      toast.error('Failed to fetch orders')
    } finally {
      hasLoadedOrdersRef.current = true
      setLoading(false)
      setRefreshing(false)
    }
  }, [dateFrom, dateTo, filter, limit, page, paymentFilter, search])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    if (!socket) return undefined

    const handleNewOrder = (order) => {
      toast.success(`New order #${order.orderNumber} received`)
      fetchOrders(true)
      fetchSummary()
    }
    const handleOrderUpdate = (order) => {
      toast(`Order #${order.orderNumber} moved to ${order.status}`)
      fetchOrders(true)
      fetchSummary()
    }

    socket.on('new_order', handleNewOrder)
    socket.on('order_updated', handleOrderUpdate)
    return () => {
      socket.off('new_order', handleNewOrder)
      socket.off('order_updated', handleOrderUpdate)
    }
  }, [fetchOrders, fetchSummary, socket])

  const resetFilters = () => {
    setFilter('all')
    setPaymentFilter('all')
    setSearch('')
    setDateFrom('')
    setDateTo('')
    setPage(1)
  }

  const applyQuickRange = (range) => {
    if (range === 'today') {
      const today = defaultToday()
      setDateFrom(today)
      setDateTo(today)
    } else if (range === 'week') {
      setDateFrom(defaultWeekStart())
      setDateTo(defaultToday())
    } else {
      setDateFrom('')
      setDateTo('')
    }
    setPage(1)
  }

  const handleTrackByOrderNumber = async () => {
    const code = trackOrderNumber.trim()
    if (!code) {
      toast.error('Enter an order number to track')
      return
    }
    try {
      const res = await api.get('/restaurant/customer-orders', {
        params: { search: code, page: 1, limit: 20 },
      })
      const found = (res?.data?.data?.orders || []).find(
        (o) => String(o.orderNumber || '').toLowerCase() === code.toLowerCase(),
      )
      if (!found) {
        toast.error('Order not found')
        return
      }
      navigate(`${restaurantBase}/orders/${found._id}`)
    } catch {
      toast.error('Failed to track order')
    }
  }

  const updateOrderStatus = async (orderId, status, estimatedWaitTime = null) => {
    try {
      await api.patch(`/restaurant/customer-orders/${orderId}/status`, { status, estimatedWaitTime })
      toast.success(`Order updated to ${status}`)
      fetchOrders(true)
      fetchSummary()
    } catch {
      toast.error('Failed to update status')
    }
  }

  const activeOrders = useMemo(() => {
    const active = summary?.active || {}
    return Number(active.pending || 0) + Number(active.confirmed || 0) + Number(active.preparing || 0) + Number(active.ready || 0)
  }, [summary])

  const visibleRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + Number(order.grandTotal || 0), 0),
    [orders],
  )

  const activeFilterCount = [filter !== 'all', paymentFilter !== 'all', search, dateFrom, dateTo].filter(Boolean).length
  const todayDate = defaultToday()
  const weekStartDate = defaultWeekStart()
  const quickRange = !dateFrom && !dateTo ? 'all' : dateFrom === todayDate && dateTo === todayDate ? 'today' : dateFrom === weekStartDate && dateTo === todayDate ? 'week' : ''

  if (loading) {
    return <RestaurantPageLoader />
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-50 via-surface-50 to-emerald-50" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm">
                <FiShoppingBag className="h-4 w-4" />
                Order Desk
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">Manage Orders</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Keep service moving with clear filters, live updates, quick actions, and focused order views.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => fetchOrders(true)} disabled={refreshing}>
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button type="button" onClick={() => navigate(`${restaurantBase}/orders/new`)}>
                <FiPlus className="mr-2" />
                Create Order
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Active orders"
              value={activeOrders}
              sub="Pending to ready"
              icon={FiClock}
              accent="from-primary-600 to-secondary-500"
            />
            <MetricTile
              label="Today"
              value={summary?.today || 0}
              sub="Orders created today"
              icon={FiCalendar}
              accent="from-emerald-500 to-teal-500"
            />
            <MetricTile
              label="Filtered total"
              value={pagination.total || 0}
              sub={`${activeFilterCount} active filters`}
              icon={FiFilter}
              accent="from-indigo-500 to-violet-500"
            />
            <MetricTile
              label="Visible value"
              value={formatRestaurantCurrency(visibleRevenue, currency)}
              sub={`${orders.length} orders on this page`}
              icon={FiTrendingUp}
              accent="from-amber-500 to-orange-500"
            />
          </div>
        </div>
      </motion.section>

      <Card
        title="Filters"
        icon={FiFilter}
        actions={
          <button type="button" onClick={resetFilters} className="text-sm font-semibold text-primary-700 hover:underline">
            Reset filters
          </button>
        }
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              icon={FiSearch}
              label="Search orders"
              placeholder="Order no, customer, phone, email"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
            />
            <Input
              label="From date"
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value)
                setPage(1)
              }}
            />
            <Input
              label="To date"
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value)
                setPage(1)
              }}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Page size</label>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value))
                  setPage(1)
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                <option value={10}>10 orders</option>
                <option value={20}>20 orders</option>
                <option value={50}>50 orders</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-2 xl:justify-end">
            <button type="button" onClick={() => applyQuickRange('today')} className={filterButtonClass(quickRange === 'today')}>
              Today
            </button>
            <button type="button" onClick={() => applyQuickRange('week')} className={filterButtonClass(quickRange === 'week')}>
              Last 7 days
            </button>
            <button type="button" onClick={() => applyQuickRange('all')} className={filterButtonClass(quickRange === 'all')}>
              All time
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setFilter(item.value)
                  setPage(1)
                }}
                className={filterButtonClass(filter === item.value)}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {PAYMENT_FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setPaymentFilter(item.value)
                  setPage(1)
                }}
                className={filterButtonClass(paymentFilter === item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 border-t border-surface-200 pt-4 lg:grid-cols-[minmax(280px,420px)_auto_1fr] lg:items-end">
          <div className="w-full">
            <Input
              label="Jump to order"
              placeholder="Exact order number"
              value={trackOrderNumber}
              onChange={(e) => setTrackOrderNumber(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTrackByOrderNumber()
              }}
            />
          </div>
          <div className="flex items-end">
            <Button type="button" onClick={handleTrackByOrderNumber} className="h-10 w-full px-5 lg:w-auto">
              Track Order
            </Button>
          </div>
          <div className="flex items-end justify-start lg:justify-end">
            <div className="flex h-10 overflow-hidden rounded-xl border border-surface-200 bg-white">
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`flex items-center gap-1 px-3 text-sm font-semibold transition ${
                  viewMode === 'card' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'
                }`}
              >
                <FiGrid className="h-4 w-4" />
                Card
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1 px-3 text-sm font-semibold transition ${
                  viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-surface-50'
                }`}
              >
                <FiList className="h-4 w-4" />
                List
              </button>
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {orders.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-surface-200 bg-white px-4 text-center shadow-sm"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-50 text-primary-600">
              <FiShoppingBag className="h-7 w-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-950">No orders found</h3>
            <p className="mt-1 max-w-md text-sm text-gray-500">
              Try changing the status, payment, search, or date filters.
            </p>
          </motion.div>
        ) : viewMode === 'card' ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-5 xl:grid-cols-2"
          >
            {orders.map((order, index) => (
              <motion.article
                key={order._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.2) }}
                whileHover={{ y: -4 }}
                className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-bold text-gray-950">#{order.orderNumber}</h3>
                      <OrderStatusBadge status={order.status} />
                      <RestaurantStatusPill value={order.paymentStatus || 'pending'} styles={paymentStatusStyles} uppercase />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      {getOrderCustomerLabel(order)} - Table {order.table?.tableNumber || 'N/A'}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">{formatRestaurantDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
                    <p className="text-2xl font-bold text-primary-700">
                      {formatRestaurantCurrency(order.grandTotal, currency)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl bg-surface-50 p-4 md:grid-cols-4">
                  <div>
                    <p className="text-xs text-gray-500">Items</p>
                    <p className="font-bold text-gray-950">{order.items?.length || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Wait</p>
                    <p className="font-bold text-gray-950">{order.estimatedWaitTime ? `${order.estimatedWaitTime} min` : 'Not set'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Source</p>
                    <p className="font-bold capitalize text-gray-950">{order.createdBy?.type || 'order'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Payment</p>
                    <p className="font-bold capitalize text-gray-950">{order.paymentMethod || 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <OrderActionButtons
                    order={order}
                    onUpdate={updateOrderStatus}
                    onView={() => navigate(`${restaurantBase}/orders/${order._id}`)}
                  />
                </div>
              </motion.article>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-x-auto rounded-3xl border border-surface-200 bg-white shadow-sm"
          >
            <table className="min-w-full divide-y divide-surface-200 text-sm">
              <thead className="bg-surface-50">
                <tr>
                  {['Order', 'Customer', 'Table', 'Status', 'Payment', 'Total', 'Date', 'Actions'].map((header) => (
                    <th key={header} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200 bg-white">
                {orders.map((order) => (
                  <tr key={order._id} className="transition hover:bg-surface-50">
                    <td className="px-5 py-4 font-bold text-gray-950">#{order.orderNumber}</td>
                    <td className="px-5 py-4 text-gray-600">{getOrderCustomerLabel(order)}</td>
                    <td className="px-5 py-4 text-gray-600">{order.table?.tableNumber || 'N/A'}</td>
                    <td className="px-5 py-4"><OrderStatusBadge status={order.status} /></td>
                    <td className="px-5 py-4">
                      <RestaurantStatusPill value={order.paymentStatus || 'pending'} styles={paymentStatusStyles} uppercase />
                    </td>
                    <td className="px-5 py-4 font-bold text-primary-700">{formatRestaurantCurrency(order.grandTotal, currency)}</td>
                    <td className="px-5 py-4 text-gray-500">{formatRestaurantDateTime(order.createdAt)}</td>
                    <td className="px-5 py-4">
                      <OrderActionButtons
                        order={order}
                        onUpdate={updateOrderStatus}
                        onView={() => navigate(`${restaurantBase}/orders/${order._id}`)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}
      </AnimatePresence>

      {orders.length > 0 && <PaginationBar pagination={pagination} onPageChange={setPage} />}
    </div>
  )
}

export default Orders
