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
} from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import { motion } from 'framer-motion'
import {
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [revenueData, setRevenueData] = useState([])
  const [subscriptionData, setSubscriptionData] = useState([])

  useEffect(() => {
    fetchDashboardData(false)
  }, [])

  const fetchDashboardData = async (quiet = true) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)
      const currentYear = new Date().getFullYear()
      const [statsRes, analyticsRes, subscriptionRes] = await Promise.all([
        api.get('/platform/dashboard/stats'),
        api.get(`/platform/dashboard/analytics/revenue?period=monthly&year=${currentYear}`),
        api.get('/platform/dashboard/analytics/subscriptions'),
      ])

      setStats(statsRes.data.data)

      const revenue = analyticsRes.data.data.data || []
      setRevenueData(revenue.map(item => ({
        name: item._id,
        revenue: item.revenue,
        invoiceCount: item.invoiceCount,
      })))

      const subscriptions = subscriptionRes.data.data || []
      setSubscriptionData(subscriptions.map(s => ({
        name: s.name,
        value: s.count,
      })))
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
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-r from-primary-50 via-surface-50 to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900" />
        <div className="relative p-5 md:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-100 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary-700 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                <FiActivity className="h-4 w-4" />
                Platform Command Center
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950 dark:text-gray-100">
                Dashboard Analytics
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Real-time overview of growth, revenue, subscriptions, and operational health.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white/90 px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Current snapshot</p>
                <p className="text-xl font-bold text-gray-950 dark:text-gray-100">{formatCompactCurrency(stats?.revenue?.total)}</p>
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
        {overviewStats.map((stat) => (
          <motion.article
            key={stat.title}
            whileHover={{ y: -3 }}
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Revenue Trend" icon={FiTrendingUp} className="lg:col-span-2">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" vertical={false} />
                <XAxis dataKey="name" tickFormatter={monthLabel} />
                <YAxis yAxisId="left" tickFormatter={(v) => formatCompactCurrency(v)} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'Revenue'
                      ? formatFullCurrency(value)
                      : Number(value || 0).toLocaleString('en-IN')
                  }
                  labelFormatter={monthLabel}
                />
                <Bar yAxisId="left" dataKey="revenue" name="Revenue" fill="#8f2800" radius={[8, 8, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Analytics Highlights" icon={FiBarChart2}>
          <div className="space-y-4">
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Revenue this year</p>
              <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-100">{formatFullCurrency(totalMonthlyRevenue)}</p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Invoices tracked</p>
              <p className="mt-1 text-2xl font-bold text-gray-950 dark:text-gray-100">{totalMonthlyInvoices.toLocaleString('en-IN')}</p>
            </div>
            <div className="rounded-xl border border-surface-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Top subscription plan</p>
              <p className="mt-1 text-xl font-bold text-gray-950 dark:text-gray-100">
                {topSubscription ? `${topSubscription.name} (${topSubscription.value})` : 'No data'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card title="Subscription Mix" icon={FiCheckCircle}>
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