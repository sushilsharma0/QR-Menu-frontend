import React, { useMemo, useState, useEffect } from 'react'
import {
  FiActivity,
  FiBarChart2,
  FiCheckCircle,
  FiUsers,
  FiShoppingBag,
  FiTrendingUp,
  FiRefreshCw,
  FiShield,
  FiCalendar,
} from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import { motion } from 'framer-motion'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import toast from '@utils/toast'
import api from '../../services/api'
import Card from '../../components/common/Card'
import Button from '../../components/common/Button'
import { RestaurantPageLoader } from '../../components/restaurant/RestaurantUI'
import { DEFAULT_CURRENCY_SYMBOL } from '../../utils/currency'

const monthLabel = (value) => {
  const parsed = new Date(`${value}-01`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'short' })
}

const formatCompactCurrency = (value) => {
  const number = Number(value || 0)
  if (number >= 10000000) return `${DEFAULT_CURRENCY_SYMBOL} ${(number / 10000000).toFixed(1)}Cr`
  if (number >= 100000) return `${DEFAULT_CURRENCY_SYMBOL} ${(number / 100000).toFixed(1)}L`
  return `${DEFAULT_CURRENCY_SYMBOL} ${number.toLocaleString('en-IN')}`
}

const formatFullCurrency = (value) =>
  `${DEFAULT_CURRENCY_SYMBOL} ${Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`

/** Label for 7-day chart X axis (UTC date key) */
const shortDayLabel = (dateKey) => {
  if (!dateKey) return ''
  const d = new Date(`${dateKey}T12:00:00.000Z`)
  if (Number.isNaN(d.getTime())) return dateKey
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function SevenDayTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  return (
    <div className="rounded-2xl border border-gray-200/90 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {shortDayLabel(label)}
      </p>
      <div className="mt-2 space-y-1.5 text-sm">
        <p className="flex justify-between gap-8">
          <span className="text-gray-500 dark:text-gray-400">Revenue</span>
          <span className="font-bold text-primary-700 dark:text-primary-300">{formatFullCurrency(row?.revenue)}</span>
        </p>
        <p className="flex justify-between gap-8">
          <span className="text-gray-500 dark:text-gray-400">Invoices</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{Number(row?.invoices || 0).toLocaleString('en-IN')}</span>
        </p>
        <p className="flex justify-between gap-8">
          <span className="text-gray-500 dark:text-gray-400">New restaurants</span>
          <span className="font-semibold text-emerald-700 dark:text-emerald-400">{Number(row?.newRestaurants || 0).toLocaleString('en-IN')}</span>
        </p>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [revenueData, setRevenueData] = useState([])
  const [subscriptionData, setSubscriptionData] = useState([])
  const [trend7d, setTrend7d] = useState([])

  useEffect(() => {
    fetchDashboardData(false)
  }, [])

  const fetchDashboardData = async (quiet = true) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)
      const currentYear = new Date().getFullYear()
      const [statsRes, analyticsRes, subscriptionRes, trendRes] = await Promise.all([
        api.get('/platform/dashboard/stats'),
        api.get(`/platform/dashboard/analytics/revenue?period=monthly&year=${currentYear}`),
        api.get('/platform/dashboard/analytics/subscriptions'),
        api.get('/platform/dashboard/analytics/trend-7d'),
      ])

      setStats(statsRes.data.data)

      const revenue = analyticsRes.data.data.data || []
      setRevenueData(
        revenue.map((item) => ({
          name: item._id,
          revenue: item.revenue,
          invoiceCount: item.invoiceCount,
        })),
      )

      const subscriptions = subscriptionRes.data.data || []
      setSubscriptionData(
        subscriptions.map((s) => ({
          name: s.name,
          value: s.count,
        })),
      )

      setTrend7d(trendRes.data?.data?.data || [])
    } catch (error) {
      toast.error('Failed to fetch dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const overviewStats = [
    {
      title: 'Total restaurants',
      value: stats?.overview?.totalRestaurants || 0,
      icon: FiUsers,
      tone: 'from-blue-500 to-indigo-500',
      help: 'All onboarded restaurants',
    },
    {
      title: 'Active restaurants',
      value: stats?.overview?.activeRestaurants || 0,
      icon: FiShoppingBag,
      tone: 'from-emerald-500 to-teal-500',
      help: 'Currently operational',
    },
    {
      title: 'Total revenue',
      value: formatCompactCurrency(stats?.revenue?.total || 0),
      icon: TbCurrencyRupee,
      tone: 'from-amber-500 to-orange-500',
      help: 'Platform gross sales',
    },
    {
      title: 'Pending KYC',
      value: stats?.overview?.pendingKYCs || 0,
      icon: FiShield,
      tone: 'from-rose-500 to-red-500',
      help: 'Needs verification',
    },
  ]

  const totalMonthlyRevenue = useMemo(
    () => revenueData.reduce((sum, item) => sum + Number(item.revenue || 0), 0),
    [revenueData],
  )

  const totalMonthlyInvoices = useMemo(
    () => revenueData.reduce((sum, item) => sum + Number(item.invoiceCount || 0), 0),
    [revenueData],
  )

  const topSubscription = useMemo(() => {
    if (!subscriptionData.length) return null
    return [...subscriptionData].sort((a, b) => Number(b.value || 0) - Number(a.value || 0))[0]
  }, [subscriptionData])

  const sevenDayRollup = useMemo(() => {
    return trend7d.reduce(
      (acc, d) => ({
        revenue: acc.revenue + Number(d.revenue || 0),
        invoices: acc.invoices + Number(d.invoices || 0),
        newRestaurants: acc.newRestaurants + Number(d.newRestaurants || 0),
      }),
      { revenue: 0, invoices: 0, newRestaurants: 0 },
    )
  }, [trend7d])

  if (loading) {
    return <RestaurantPageLoader />
  }

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-br from-primary-600/12 via-surface-50 to-violet-500/10 dark:from-primary-900/30 dark:via-gray-900 dark:to-violet-950/20" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-800 shadow-sm dark:border-gray-700 dark:bg-gray-800/90 dark:text-primary-200">
                <FiActivity className="h-4 w-4" />
                Platform command center
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-100">Dashboard</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
                Seven-day pulse on revenue and signups, plus performance for the full year ahead.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-surface-200 bg-white/95 px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800/90">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Lifetime revenue</p>
                <p className="text-xl font-bold text-gray-950 dark:text-gray-100">{formatCompactCurrency(stats?.revenue?.total)}</p>
                <p className="text-[11px] text-gray-500 dark:text-gray-500">Today: {formatCompactCurrency(stats?.revenue?.today)}</p>
              </div>
              <Button variant="secondary" onClick={() => fetchDashboardData(true)} disabled={refreshing}>
                <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewStats.map((stat, i) => (
          <motion.article
            key={stat.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{stat.title}</p>
                <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-gray-100">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.help}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${stat.tone} text-white shadow-md`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-md dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="border-b border-surface-100 bg-gradient-to-r from-gray-50/90 to-white px-5 py-4 dark:border-gray-800 dark:from-gray-950 dark:to-gray-900 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                <FiCalendar className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Last 7 days</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Subscription invoice revenue, invoice count, and new restaurant signups by day.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <span className="rounded-xl bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-900 dark:bg-primary-950/50 dark:text-primary-200">
                Revenue: {formatCompactCurrency(sevenDayRollup.revenue)}
              </span>
              <span className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                Invoices: {sevenDayRollup.invoices.toLocaleString('en-IN')}
              </span>
              <span className="rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200">
                New tenants: {sevenDayRollup.newRestaurants.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
        <div className="h-80 p-4 sm:h-96 sm:p-5">
          {trend7d.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trend7d} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="platRev7d" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c2410c" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#c2410c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 6" stroke="rgb(148 163 184 / 0.25)" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={shortDayLabel}
                  tick={{ fontSize: 11, fill: 'rgb(100 116 139)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(v) => formatCompactCurrency(v)}
                  width={72}
                  tick={{ fontSize: 11, fill: 'rgb(100 116 139)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  width={36}
                  tick={{ fontSize: 11, fill: 'rgb(100 116 139)' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<SevenDayTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#9a3412"
                  strokeWidth={2}
                  fill="url(#platRev7d)"
                  animationDuration={900}
                />
                <Bar
                  yAxisId="right"
                  dataKey="invoices"
                  name="Invoices"
                  fill="rgb(71 85 105 / 0.55)"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={28}
                  animationDuration={800}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="newRestaurants"
                  name="New restaurants"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#fff', strokeWidth: 2, stroke: '#059669' }}
                  activeDot={{ r: 5 }}
                  animationDuration={900}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center dark:border-gray-700 dark:bg-gray-900/40">
              <FiBarChart2 className="h-10 w-10 text-gray-400" />
              <p className="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">No 7-day activity yet</p>
              <p className="mt-1 max-w-xs text-xs text-gray-500 dark:text-gray-400">
                Invoice and signup data will fill this chart as tenants subscribe and onboard.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Revenue by month (this year)" icon={FiTrendingUp} className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" className="dark:stroke-gray-700" vertical={false} />
                <XAxis dataKey="name" tickFormatter={monthLabel} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tickFormatter={(v) => formatCompactCurrency(v)} width={72} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Revenue'
                      ? formatFullCurrency(value)
                      : Number(value || 0).toLocaleString('en-IN')
                  }
                  labelFormatter={monthLabel}
                  contentStyle={{ borderRadius: 12 }}
                />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#8f2800" radius={[8, 8, 0, 0]} animationDuration={800} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Highlights" icon={FiBarChart2}>
          <div className="space-y-3">
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Revenue YTD chart</p>
              <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-100">{formatFullCurrency(totalMonthlyRevenue)}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-500">Summed monthly buckets shown left</p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Invoices tracked (YTD)</p>
              <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-100">{totalMonthlyInvoices.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Top subscription plan</p>
              <p className="mt-1 text-lg font-bold text-gray-950 dark:text-gray-100">
                {topSubscription ? `${topSubscription.name} (${topSubscription.value})` : 'No data'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Subscription mix" icon={FiCheckCircle}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {subscriptionData.length > 0 ? (
            subscriptionData.map((item) => (
              <div key={item.name} className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.name}</p>
                <p className="mt-1 text-xl font-bold text-primary-700 dark:text-primary-300">{item.value}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No subscription breakdown available.</p>
          )}
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
