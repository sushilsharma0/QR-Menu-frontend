import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  FiBarChart2,
  FiCalendar,
  FiCreditCard,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiSearch,
  FiShoppingBag,
  FiTrendingUp,
} from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Table from '../../components/common/Table'
import Pagination from '../../components/common/Pagination'
import {
  RestaurantStatusPill,
  formatRestaurantCurrency,
  formatRestaurantShortDate,
  orderStatusStyles,
  paymentStatusStyles,
} from '../../components/restaurant/RestaurantUI'
import { getOrderActivityReport } from '../../services/restaurant'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import { formatters } from '../../utils/formatters'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

const CHART_COLORS = ['#8f2800', '#f59e0b', '#059669', '#2563eb', '#dc2626', '#7c3aed', '#0f766e']

function defaultToDate() {
  return formatDateInputValue(new Date())
}

function defaultFromDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return formatDateInputValue(d)
}

function formatDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function titleCase(value) {
  return String(value || 'Unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function SalesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  const sales = payload.find((item) => item.dataKey === 'grandTotal')?.value || 0
  const orders = payload.find((item) => item.dataKey === 'orderCount')?.value || 0

  return (
    <div className="rounded-2xl border border-surface-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{formatRestaurantShortDate(label)}</p>
      <div className="mt-2 space-y-1 text-sm">
        <p className="flex items-center justify-between gap-8">
          <span className="text-gray-500">Gross sales</span>
          <span className="font-bold text-primary-700">{formatRestaurantCurrency(sales)}</span>
        </p>
        <p className="flex items-center justify-between gap-8">
          <span className="text-gray-500">Orders</span>
          <span className="font-bold text-emerald-700">{orders}</span>
        </p>
      </div>
    </div>
  )
}

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-2xl border border-surface-200 bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{titleCase(label)}</p>
      <div className="mt-2 space-y-1 text-sm">
        {payload.map((item) => {
          const countLike = ['count', 'orderCount', 'quantity'].includes(item.dataKey)
          return (
            <p key={item.dataKey} className="flex items-center justify-between gap-8">
              <span className="text-gray-500">{item.name || item.dataKey}</span>
              <span className="font-bold text-primary-700">
                {countLike ? Number(item.value || 0).toLocaleString('en-IN') : formatRestaurantCurrency(item.value)}
              </span>
            </p>
          )
        })}
      </div>
    </div>
  )
}

function SummaryTile({ label, value, sub, icon: Icon, accent }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="rounded-2xl border border-surface-200 bg-white/90 p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-gray-950">{value}</p>
          {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  )
}

export default function OrderActivityReport() {
  const { restaurantBase } = useTenantRoutes()
  const [from, setFrom] = useState(defaultFromDate)
  const [to, setTo] = useState(defaultToDate)
  const [orderNumberQ, setOrderNumberQ] = useState('')
  const [appliedQ, setAppliedQ] = useState('')
  const [rows, setRows] = useState([])
  const [daily, setDaily] = useState([])
  const [totals, setTotals] = useState(null)
  const [breakdowns, setBreakdowns] = useState({})
  const [pagination, setPagination] = useState({ page: 1, limit: 40, total: 0, pages: 1 })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const params = { page, limit: 40, from, to }
      if (appliedQ.trim()) params.orderNumber = appliedQ.trim()
      const envelope = await getOrderActivityReport(params)
      const data = envelope.data
      setRows(data.rows || [])
      setDaily(data.daily || [])
      setTotals(data.totals || null)
      setBreakdowns(data.breakdowns || {})
      setPagination(data.pagination || { page: 1, limit: 40, total: 0, pages: 1 })
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load sales activity')
    } finally {
      setLoading(false)
    }
  }, [page, from, to, appliedQ])

  useEffect(() => {
    load()
  }, [load])

  const applySearch = () => {
    setAppliedQ(orderNumberQ.trim())
    setPage(1)
  }

  const resetRange = () => {
    setFrom(defaultFromDate())
    setTo(defaultToDate())
    setOrderNumberQ('')
    setAppliedQ('')
    setPage(1)
  }

  const t = totals || {}
  const chartData = useMemo(
    () =>
      [...daily]
        .reverse()
        .map((item) => ({
          ...item,
          grandTotal: Number(item.grandTotal || 0),
          orderCount: Number(item.orderCount || 0),
        })),
    [daily],
  )
  const activeDays = daily.length || 1
  const avgOrderValue = Number(t.orderCount || 0) ? Number(t.grandTotal || 0) / Number(t.orderCount || 0) : 0
  const avgDailySales = Number(t.grandTotal || 0) / activeDays
  const bestDay = daily.reduce(
    (best, item) => (Number(item.grandTotal || 0) > Number(best?.grandTotal || 0) ? item : best),
    null,
  )
  const hasChartData = chartData.some((item) => item.grandTotal > 0 || item.orderCount > 0)
  const activeFilterCount = [from, to, appliedQ].filter(Boolean).length
  const detailsModel = useMemo(() => {
    const mapAmountBreakdown = (items = [], keyName = 'name') =>
      items
        .map((item) => ({
          [keyName]: titleCase(item._id),
          raw: item._id,
          count: Number(item.count || item.orderCount || 0),
          amount: Number(item.amount || item.grandTotal || 0),
        }))
        .filter((item) => item.count > 0 || item.amount > 0)

    const topItemChart = (breakdowns.topItems || []).map((item) => ({
      name: item._id?.length > 18 ? `${item._id.slice(0, 18)}...` : item._id || 'Item',
      quantity: Number(item.quantity || 0),
      revenue: Number(item.revenue || 0),
    }))
    const tableChart = (breakdowns.tables || []).map((item) => ({
      table: `Table ${item.tableNumber}`,
      orderCount: Number(item.orderCount || 0),
      grandTotal: Number(item.grandTotal || 0),
    }))
    const hourlyChart = (breakdowns.hourly || []).map((item) => ({
      hour: item._id,
      orderCount: Number(item.orderCount || 0),
      grandTotal: Number(item.grandTotal || 0),
    }))

    return {
      status: mapAmountBreakdown(breakdowns.status, 'status'),
      paymentStatus: mapAmountBreakdown(breakdowns.paymentStatus, 'status'),
      paymentMethod: mapAmountBreakdown(breakdowns.paymentMethod, 'method'),
      channel: mapAmountBreakdown(breakdowns.channel, 'channel'),
      topItemChart,
      tableChart,
      hourlyChart,
      paidRate: Number(t.grandTotal || 0) > 0 ? (Number(t.paidValue || 0) / Number(t.grandTotal || 0)) * 100 : 0,
      taxRate: Number(t.grandTotal || 0) > 0 ? (Number(t.tax || 0) / Number(t.grandTotal || 0)) * 100 : 0,
      discountRate: Number(t.grandTotal || 0) > 0 ? (Number(t.discount || 0) / Number(t.grandTotal || 0)) * 100 : 0,
      itemsPerOrder: Number(t.orderCount || 0) > 0 ? Number(t.itemCount || 0) / Number(t.orderCount || 0) : 0,
    }
  }, [breakdowns, t])

  const summaryTiles = [
    {
      label: 'Gross sales',
      value: formatRestaurantCurrency(t.grandTotal),
      sub: `${t.orderCount || 0} orders in selected range`,
      icon: TbCurrencyRupee,
      accent: 'from-primary-600 to-secondary-500',
    },
    {
      label: 'Average order',
      value: formatRestaurantCurrency(avgOrderValue),
      sub: 'Gross sales divided by orders',
      icon: FiCreditCard,
      accent: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Daily average',
      value: formatRestaurantCurrency(avgDailySales),
      sub: `${daily.length || 0} active sales days`,
      icon: FiTrendingUp,
      accent: 'from-amber-500 to-orange-500',
    },
    {
      label: 'Best day',
      value: formatRestaurantShortDate(bestDay?.date),
      sub: bestDay ? formatRestaurantCurrency(bestDay.grandTotal) : 'No orders yet',
      icon: FiCalendar,
      accent: 'from-indigo-500 to-violet-500',
    },
    {
      label: 'Paid value',
      value: formatRestaurantCurrency(t.paidValue),
      sub: `${detailsModel.paidRate.toFixed(1)}% collected`,
      icon: FiCreditCard,
      accent: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Pending value',
      value: formatRestaurantCurrency(t.unpaidValue),
      sub: 'Pending, partial, or failed payments',
      icon: FiShoppingBag,
      accent: 'from-red-500 to-rose-500',
    },
    {
      label: 'Items sold',
      value: Number(t.itemCount || 0).toLocaleString('en-IN'),
      sub: `${detailsModel.itemsPerOrder.toFixed(2)} items per order`,
      icon: FiShoppingBag,
      accent: 'from-sky-500 to-blue-500',
    },
    {
      label: 'Tax collected',
      value: formatRestaurantCurrency(t.tax),
      sub: `${detailsModel.taxRate.toFixed(1)}% of gross sales`,
      icon: TbCurrencyRupee,
      accent: 'from-violet-500 to-purple-500',
    },
  ]

  const orderColumns = [
    {
      header: 'Order #',
      render: (row) => (
        <Link
          to={`${restaurantBase}/orders/${row._id}`}
          className="font-semibold text-primary-600 hover:underline"
        >
          {row.orderNumber}
        </Link>
      ),
    },
    {
      header: 'Date',
      render: (row) => formatters.datetime(row.createdAt),
    },
    {
      header: 'Customer',
      render: (row) => {
        const name = String(row.customerName || '').trim()
        if (row.guestId && (!name || name.toLowerCase() === 'guest' || name.toLowerCase() === 'qr customer')) {
          return row.guestId
        }
        return name || row.guestId || 'N/A'
      },
    },
    {
      header: 'Table',
      render: (row) => row.tableNumber || 'N/A',
    },
    {
      header: 'Items',
      render: (row) => (
        <span className="block max-w-xs truncate text-gray-700" title={row.itemsLabel}>
          {row.itemsLabel || 'No items'}
        </span>
      ),
    },
    {
      header: 'Payment',
      render: (row) => <RestaurantStatusPill value={row.paymentStatus} styles={paymentStatusStyles} />,
    },
    {
      header: 'Status',
      render: (row) => <RestaurantStatusPill value={row.status} styles={orderStatusStyles} />,
    },
    {
      header: 'Total',
      render: (row) => <span className="font-bold text-primary-700">{formatRestaurantCurrency(row.grandTotal)}</span>,
    },
  ]

  const dailyColumns = [
    { header: 'Date', render: (r) => formatRestaurantShortDate(r.date) },
    { header: 'Orders', render: (r) => r.orderCount },
    {
      header: 'Subtotal',
      render: (r) => formatRestaurantCurrency(r.subtotal),
    },
    {
      header: 'Tax',
      render: (r) => formatRestaurantCurrency(r.tax),
    },
    {
      header: 'Gross sales',
      render: (r) => <span className="font-bold text-primary-700">{formatRestaurantCurrency(r.grandTotal)}</span>,
    },
  ]

  const exportDailyCSV = () => {
    if (!daily.length) {
      toast.error('No daily sales data to export')
      return
    }

    const headers = ['Date', 'Orders', 'Subtotal', 'Tax', 'Gross Sales']
    const csvRows = daily.map((item) => [
      item.date,
      item.orderCount,
      Number(item.subtotal || 0).toFixed(2),
      Number(item.tax || 0).toFixed(2),
      Number(item.grandTotal || 0).toFixed(2),
    ])
    const csv = [headers, ...csvRows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sales_activity_${from}_to_${to}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Sales activity exported')
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
                <FiBarChart2 className="h-4 w-4" />
                Sales Activity
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
                Sales activity report
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-500">
                Review daily income, tax, order activity, and payment progress from backend order data.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={load} disabled={loading}>
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button type="button" onClick={exportDailyCSV}>
                <FiDownload className="mr-2" />
                Export daily CSV
              </Button>
            </div>
          </div>

          <motion.div
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
            }}
            initial="hidden"
            animate="visible"
            className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            {summaryTiles.map((tile) => (
              <SummaryTile key={tile.label} {...tile} />
            ))}
          </motion.div>
        </div>
      </motion.section>

      <Card
        title="Filters"
        icon={FiFilter}
        actions={
          <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-semibold text-primary-700">
            {activeFilterCount} active
          </span>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Input
            label="From"
            type="date"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value)
              setPage(1)
            }}
          />
          <Input
            label="To"
            type="date"
            value={to}
            onChange={(e) => {
              setTo(e.target.value)
              setPage(1)
            }}
          />
          <div className="xl:col-span-2">
            <Input
              label="Order number contains"
              icon={FiSearch}
              value={orderNumberQ}
              onChange={(e) => setOrderNumberQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') applySearch()
              }}
              placeholder="Search by order number"
            />
          </div>
          <div className="flex items-end gap-2">
            <Button type="button" onClick={applySearch} className="flex-1">
              Search
            </Button>
            <Button type="button" variant="secondary" onClick={resetRange} className="flex-1">
              Reset
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="xl:col-span-2"
        >
          <Card title="Daily sales performance" icon={FiTrendingUp}>
            {hasChartData ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="activitySalesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8f2800" stopOpacity={0.92} />
                        <stop offset="100%" stopColor="#b64a26" stopOpacity={0.2} />
                      </linearGradient>
                      <linearGradient id="activityAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatRestaurantShortDate}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      dy={8}
                    />
                    <YAxis
                      yAxisId="sales"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      tickFormatter={(value) => `${DEFAULT_CURRENCY_SYMBOL}${Math.round(Number(value || 0) / 1000)}k`}
                      width={56}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6b7280', fontSize: 12 }}
                      width={34}
                    />
                    <Tooltip content={<SalesTooltip />} cursor={{ fill: '#fffcf1' }} />
                    <Area
                      yAxisId="orders"
                      type="monotone"
                      dataKey="orderCount"
                      fill="url(#activityAreaGradient)"
                      stroke="#10b981"
                      strokeWidth={3}
                      animationDuration={900}
                    />
                    <Bar
                      yAxisId="sales"
                      dataKey="grandTotal"
                      fill="url(#activitySalesGradient)"
                      radius={[10, 10, 4, 4]}
                      barSize={34}
                      animationDuration={900}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl bg-surface-50 px-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm">
                  <FiBarChart2 className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-950">No sales activity found</h3>
                <p className="mt-1 max-w-md text-sm text-gray-500">
                  Try a wider date range or clear the order number search.
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        <Card title="Recent activity" icon={FiShoppingBag} className="self-start">
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {rows.slice(0, 6).map((row) => (
              <Link
                key={row._id}
                to={`${restaurantBase}/orders/${row._id}`}
                className="block rounded-2xl border border-surface-200 bg-white p-4 transition hover:border-primary-100 hover:bg-surface-50 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-950">#{row.orderNumber}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {(() => {
                        const name = String(row.customerName || '').trim()
                        const label = row.guestId && (!name || name.toLowerCase() === 'guest' || name.toLowerCase() === 'qr customer')
                          ? row.guestId
                          : name || row.guestId || 'Guest'
                        return `${label} - Table ${row.tableNumber || 'N/A'}`
                      })()}
                    </p>
                  </div>
                  <p className="font-bold text-primary-700">{formatRestaurantCurrency(row.grandTotal)}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <RestaurantStatusPill value={row.status} styles={orderStatusStyles} />
                  <RestaurantStatusPill value={row.paymentStatus} styles={paymentStatusStyles} />
                </div>
              </Link>
            ))}
            {!rows.length && (
              <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500">
                No recent orders for this filter.
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
        <Card title="Order status ring" icon={FiBarChart2}>
          {detailsModel.status.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={detailsModel.status} dataKey="count" nameKey="status" innerRadius={58} outerRadius={92} paddingAngle={4}>
                    {detailsModel.status.map((entry, index) => (
                      <Cell key={entry.status} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ActivityTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500">No order status data.</div>
          )}
        </Card>

        <Card title="Payment status ring" icon={FiCreditCard}>
          {detailsModel.paymentStatus.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={detailsModel.paymentStatus} dataKey="amount" nameKey="status" innerRadius={58} outerRadius={92} paddingAngle={4}>
                    {detailsModel.paymentStatus.map((entry, index) => (
                      <Cell key={entry.status} fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ActivityTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500">No payment status data.</div>
          )}
        </Card>

        <Card title="Payment methods" icon={FiCreditCard}>
          {detailsModel.paymentMethod.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={detailsModel.paymentMethod} dataKey="amount" nameKey="method" innerRadius={58} outerRadius={92} paddingAngle={4}>
                    {detailsModel.paymentMethod.map((entry, index) => (
                      <Cell key={entry.method} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ActivityTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500">No payment method data.</div>
          )}
        </Card>

        <Card title="Order channels" icon={FiShoppingBag}>
          {detailsModel.channel.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={detailsModel.channel} dataKey="amount" nameKey="channel" innerRadius={58} outerRadius={92} paddingAngle={4}>
                    {detailsModel.channel.map((entry, index) => (
                      <Cell key={entry.channel} fill={CHART_COLORS[(index + 3) % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ActivityTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500">No channel data.</div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Hourly sales activity" icon={FiTrendingUp}>
          {detailsModel.hourlyChart.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={detailsModel.hourlyChart} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis yAxisId="orders" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={36} />
                  <YAxis
                    yAxisId="sales"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `${DEFAULT_CURRENCY_SYMBOL}${Math.round(Number(value || 0) / 1000)}k`}
                    width={56}
                  />
                  <Tooltip content={<ActivityTooltip />} cursor={{ fill: '#fffcf1' }} />
                  <Bar yAxisId="orders" dataKey="orderCount" name="Orders" fill="#059669" radius={[10, 10, 4, 4]} barSize={32} />
                  <Area yAxisId="sales" type="monotone" dataKey="grandTotal" name="Sales" fill="#8f280033" stroke="#8f2800" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500">No hourly data for this range.</div>
          )}
        </Card>

        <Card title="Busiest tables" icon={FiShoppingBag}>
          {detailsModel.tableChart.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={detailsModel.tableChart} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="table" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis yAxisId="orders" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={36} />
                  <YAxis
                    yAxisId="sales"
                    orientation="right"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    tickFormatter={(value) => `${DEFAULT_CURRENCY_SYMBOL}${Math.round(Number(value || 0) / 1000)}k`}
                    width={56}
                  />
                  <Tooltip content={<ActivityTooltip />} cursor={{ fill: '#fffcf1' }} />
                  <Bar yAxisId="orders" dataKey="orderCount" name="Orders" fill="#2563eb" radius={[10, 10, 4, 4]} barSize={34} />
                  <Area yAxisId="sales" type="monotone" dataKey="grandTotal" name="Sales" fill="#f59e0b33" stroke="#f59e0b" strokeWidth={3} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500">No table data for this range.</div>
          )}
        </Card>
      </div>

      <Card title="Top selling items" icon={FiShoppingBag}>
        {detailsModel.topItemChart.length > 0 ? (
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={detailsModel.topItemChart} layout="vertical" margin={{ top: 12, right: 24, left: 40, bottom: 0 }}>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} width={140} />
                <Tooltip content={<ActivityTooltip />} cursor={{ fill: '#fffcf1' }} />
                <Bar dataKey="quantity" name="Quantity" fill="#059669" radius={[0, 12, 12, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-2xl bg-surface-50 p-6 text-center text-sm text-gray-500">No item data for this range.</div>
        )}
      </Card>

      <Card title="Sales details">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Subtotal', formatRestaurantCurrency(t.subtotal)],
            ['Discount', formatRestaurantCurrency(t.discount)],
            ['Discount rate', `${detailsModel.discountRate.toFixed(1)}%`],
            ['Tax rate', `${detailsModel.taxRate.toFixed(1)}%`],
            ['Paid value', formatRestaurantCurrency(t.paidValue)],
            ['Pending value', formatRestaurantCurrency(t.unpaidValue)],
            ['Items per order', detailsModel.itemsPerOrder.toFixed(2)],
            ['Total rows', Number(pagination.total || rows.length).toLocaleString('en-IN')],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-surface-200 bg-surface-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
              <p className="mt-1 text-xl font-bold text-gray-950">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Daily income">
        <p className="mb-3 text-sm text-gray-600">
          Totals grouped by calendar day from backend order data.
        </p>
        <Table columns={dailyColumns} data={daily} loading={loading && daily.length === 0} />
      </Card>

      <Card title={`Orders list (${pagination.total || rows.length})`}>
        <p className="mb-3 text-sm text-gray-600">
          Click an order number to open full order details.
        </p>
        <Table columns={orderColumns} data={rows} loading={loading} />
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  )
}
