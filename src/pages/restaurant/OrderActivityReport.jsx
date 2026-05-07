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
  CartesianGrid,
  ComposedChart,
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

function defaultToDate() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}

function defaultFromDate() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
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
      render: (row) => row.customerName || 'N/A',
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
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value)
                setPage(1)
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
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

        <Card title="Recent activity" icon={FiShoppingBag}>
          <div className="space-y-3">
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
                      {row.customerName || 'Guest'} - Table {row.tableNumber || 'N/A'}
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
