import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FiBarChart2,
  FiCheckCircle,
  FiClock,
  FiClipboard,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingDown,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
import { LazyMotion, domAnimation, m } from 'framer-motion'
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
import Button from '../../components/common/Button'
import { useSocket } from '../../hooks/useSocket'
import useOrderAlerts from '../../hooks/useOrderAlerts'
import { useAuth } from '../../hooks/useAuth'
import { useBranch } from '../../context/BranchContext'
import { useTenantRoutes } from '../../hooks/useTenantRoutes'
import {
  RestaurantPageLoader,
  RestaurantStatusPill,
  formatRestaurantCurrency,
  formatRestaurantShortDate,
  orderStatusStyles,
} from '../../components/restaurant/RestaurantUI'

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
}

const formatPctTrend = (pct) => {
  if (pct === null || pct === undefined) return { text: 'New', up: true }
  const rounded = Math.round(Number(pct) * 10) / 10
  return { text: `${rounded >= 0 ? '+' : ''}${rounded}%`, up: rounded >= 0 }
}

function MetricCard({ title, value, sub, icon: Icon, accent, trend }) {
  return (
    <m.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="relative overflow-hidden rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
    >
      <div className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${accent} opacity-10`} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-gray-950 dark:text-gray-100">{value}</p>
          {sub && <p className="mt-1 text-sm text-gray-500">{sub}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accent} text-white shadow-md`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {trend && (
        <div className="relative mt-3 flex items-center gap-1 text-sm">
          {trend.up ? <FiTrendingUp className="h-4 w-4 text-green-600" /> : <FiTrendingDown className="h-4 w-4 text-red-600" />}
          <span className={`font-semibold ${trend.up ? 'text-green-700' : 'text-red-700'}`}>{trend.text}</span>
          <span className="text-gray-500">{trend.label}</span>
        </div>
      )}
    </m.div>
  )
}

const ManagerDashboard = () => {
  const { user } = useAuth()
  const { managerBase } = useTenantRoutes()
  const { selectedBranchId, loading: branchesLoading } = useBranch()
  const [stats, setStats] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { socket } = useSocket()

  useOrderAlerts({
    role: 'manager',
    onRefresh: () => fetchDashboardData(true),
  })

  const fetchDashboardData = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)
      const [statsRes, salesRes] = await Promise.all([
        api.get('/restaurant/dashboard/stats'),
        api.get('/restaurant/dashboard/analytics/sales?days=7'),
      ])
      setStats(statsRes.data.data)
      const sales = salesRes.data.data.data || []
      setSalesData(
        sales.map((item) => ({
          date: item._id,
          revenue: item.revenue,
          orders: item.orders,
        })),
      )
    } catch (err) {
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (branchesLoading) return
    fetchDashboardData()
  }, [branchesLoading, selectedBranchId])

  useEffect(() => {
    if (!socket) return undefined
    const refresh = () => fetchDashboardData(true)
    socket.on('order_updated', refresh)
    socket.on('payment_updated', refresh)
    socket.on('new_order', refresh)
    return () => {
      socket.off('order_updated', refresh)
      socket.off('payment_updated', refresh)
      socket.off('new_order', refresh)
    }
  }, [socket])

  const model = useMemo(() => {
    const active = stats?.activeOrders || {}
    const activeTotal = Object.values(active).reduce((a, b) => a + Number(b || 0), 0)
    const totalRev = salesData.reduce((s, i) => s + Number(i.revenue || 0), 0)
    const totalOrd = salesData.reduce((s, i) => s + Number(i.orders || 0), 0)
    return {
      active,
      activeTotal,
      todayTrend: formatPctTrend(stats?.overview?.todayVsYesterdayPercent),
      weekTrend: formatPctTrend(stats?.overview?.weekVsPrevWeekPercent),
      totalRev,
      totalOrd,
      avgOrder: totalOrd ? totalRev / totalOrd : 0,
      hasSales: salesData.some((i) => Number(i.revenue || 0) > 0),
    }
  }, [stats, salesData])

  if (loading) return <RestaurantPageLoader />

  const quickLinks = [
    { to: `${managerBase}/sales-activity`, label: 'Sales activity', icon: FiTrendingUp },
    { to: `${managerBase}/reports`, label: 'Reports', icon: FiClipboard },
    { to: `${managerBase}/orders`, label: 'Orders', icon: FiShoppingBag },
    { to: `${managerBase}/team`, label: 'Staff', icon: FiUsers },
  ]

  const metrics = [
    {
      title: "Today's orders",
      value: stats?.overview?.todayOrders ?? 0,
      sub: 'All channels',
      icon: FiShoppingBag,
      accent: 'from-primary-600 to-secondary-500',
    },
    {
      title: "Today's revenue",
      value: formatRestaurantCurrency(stats?.overview?.todayRevenue),
      sub: 'Paid orders',
      icon: TbCurrencyRupee,
      accent: 'from-emerald-500 to-teal-500',
      trend: { ...model.todayTrend, label: 'vs yesterday' },
    },
    {
      title: 'Week revenue',
      value: formatRestaurantCurrency(stats?.overview?.weekRevenue),
      sub: 'Current week',
      icon: FiBarChart2,
      accent: 'from-indigo-500 to-violet-500',
      trend: { ...model.weekTrend, label: 'vs last week' },
    },
    {
      title: 'Active pipeline',
      value: model.activeTotal,
      sub: 'Pending · prep · ready',
      icon: FiClock,
      accent: 'from-amber-500 to-orange-500',
    },
  ]

  return (
    <LazyMotion features={domAnimation}>
    <div className="mx-auto max-w-[1600px] space-y-6">
      <m.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-slate-800/20 bg-gradient-to-br from-slate-900 via-primary-900 to-slate-800 p-6 text-white shadow-xl md:p-8"
      >
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">Manager command center</p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Hello, {user?.name?.split(' ')[0] || 'Manager'}
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              Track sales, service flow, tables, and team performance for your branch in one place.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/65">Pending</p>
              <p className="text-2xl font-black">{model.active.pending || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
              <p className="text-xs text-white/65">Low stock</p>
              <p className="text-2xl font-black">{stats?.resources?.lowStockCount || 0}</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing}
              className="!border-0 !bg-white !text-slate-900"
            >
              <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </m.section>

      <m.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {metrics.map((m) => (
          <MetricCard key={m.title} {...m} />
        ))}
      </m.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {quickLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="flex items-center gap-3 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm transition hover:border-primary-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-gray-800">
              <link.icon className="h-5 w-5" />
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{link.label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-100">7-day sales</h2>
            <span className="text-sm font-semibold text-primary-700">
              {formatRestaurantCurrency(model.totalRev)}
            </span>
          </div>
          {model.hasSales ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesData}>
                  <CartesianGrid strokeDasharray="4 6" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={formatRestaurantShortDate} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={formatRestaurantShortDate}
                    formatter={(value, name) =>
                      name === 'revenue' ? [formatRestaurantCurrency(value), 'Revenue'] : [value, 'Orders']
                    }
                  />
                  <Legend />
                  <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#8f280033" stroke="#8f2800" />
                  <Bar yAxisId="right" dataKey="orders" fill="#059669" radius={[6, 6, 0, 0]} barSize={18} />
                  <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8f2800" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-gray-500">No paid sales in the last 7 days yet.</p>
          )}
        </section>

        <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-100">Kitchen pulse</h2>
          <div className="mt-4 space-y-3">
            {[
              ['Pending', model.active.pending, 'text-amber-700 bg-amber-50'],
              ['Preparing', model.active.preparing, 'text-blue-700 bg-blue-50'],
              ['Ready', model.active.ready, 'text-emerald-700 bg-emerald-50'],
            ].map(([label, value, cls]) => (
              <div key={label} className={`flex items-center justify-between rounded-2xl px-4 py-3 ${cls}`}>
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-2xl font-black">{value || 0}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-surface-100 pt-4 dark:border-gray-800">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tables active</span>
              <span className="font-bold">{stats?.resources?.activeTables || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Staff on branch</span>
              <span className="font-bold">{stats?.resources?.totalEmployees || 0}</span>
            </div>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-surface-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-surface-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-gray-100">Recent orders</h2>
          <Link to={`${managerBase}/orders`} className="text-sm font-semibold text-primary-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="divide-y divide-surface-100 dark:divide-gray-800">
          {(stats?.recentOrders || []).slice(0, 8).map((order) => (
            <Link
              key={order._id}
              to={`${managerBase}/orders/${order._id}`}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-50 dark:hover:bg-gray-800/50"
            >
              <div>
                <p className="font-bold text-gray-950 dark:text-gray-100">#{order.orderNumber}</p>
                <p className="text-sm text-gray-500">
                  Table {order.table?.tableNumber || '—'} · {formatRestaurantShortDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <RestaurantStatusPill status={order.status} styles={orderStatusStyles} />
                <span className="font-bold text-primary-800">{formatRestaurantCurrency(order.grandTotal)}</span>
                <FiCheckCircle className="h-4 w-4 text-gray-300" />
              </div>
            </Link>
          ))}
          {!(stats?.recentOrders || []).length && (
            <p className="px-5 py-10 text-center text-sm text-gray-500">No recent orders.</p>
          )}
        </div>
      </section>
    </div>
    </LazyMotion>
  )
}

export default ManagerDashboard
