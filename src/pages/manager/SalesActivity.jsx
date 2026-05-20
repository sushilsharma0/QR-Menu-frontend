import React, { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiCalendar, FiRefreshCw, FiTrendingUp } from 'react-icons/fi'
import { TbCurrencyRupee } from 'react-icons/tb'
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
import { useBranch } from '../../context/BranchContext'
import {
  RestaurantPageLoader,
  formatRestaurantCurrency,
  formatRestaurantShortDate,
} from '../../components/restaurant/RestaurantUI'

const PERIODS = [
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
]

const ManagerSalesActivity = () => {
  const { selectedBranchId, loading: branchesLoading } = useBranch()
  const [days, setDays] = useState('7')
  const [salesData, setSalesData] = useState([])
  const [popularItems, setPopularItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async (quiet = false) => {
    try {
      if (quiet) setRefreshing(true)
      else setLoading(true)
      const [salesRes, popularRes] = await Promise.all([
        api.get(`/restaurant/dashboard/analytics/sales?days=${days}`),
        api.get(`/restaurant/dashboard/analytics/popular-items?days=${days}&limit=8`),
      ])
      const sales = salesRes.data.data.data || []
      setSalesData(
        sales.map((row) => ({
          date: row._id,
          revenue: row.revenue,
          orders: row.orders,
          avgOrderValue: row.avgOrderValue,
        })),
      )
      setPopularItems(popularRes.data.data || [])
    } catch {
      toast.error('Failed to load sales activity')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (branchesLoading) return
    fetchData()
  }, [branchesLoading, selectedBranchId, days])

  const summary = useMemo(() => {
    const revenue = salesData.reduce((s, r) => s + Number(r.revenue || 0), 0)
    const orders = salesData.reduce((s, r) => s + Number(r.orders || 0), 0)
    const best = salesData.reduce(
      (b, r) => (Number(r.revenue || 0) > Number(b?.revenue || 0) ? r : b),
      null,
    )
    return { revenue, orders, avg: orders ? revenue / orders : 0, best }
  }, [salesData])

  if (loading) return <RestaurantPageLoader />

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">Analytics</p>
          <h1 className="text-2xl font-black text-gray-950 dark:text-gray-100">Sales activity</h1>
          <p className="mt-1 text-sm text-gray-500">Paid revenue and order volume over time.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-surface-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-900">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setDays(p.value)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  days === p.value
                    ? 'bg-primary-700 text-white'
                    : 'text-gray-600 hover:bg-surface-50 dark:text-gray-300'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <Button variant="outline" onClick={() => fetchData(true)} disabled={refreshing}>
            <FiRefreshCw className={`mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total revenue', value: formatRestaurantCurrency(summary.revenue), icon: TbCurrencyRupee },
          { label: 'Orders', value: summary.orders, icon: FiTrendingUp },
          { label: 'Avg order value', value: formatRestaurantCurrency(summary.avg), icon: FiBarChart2 },
          {
            label: 'Best day',
            value: summary.best ? formatRestaurantShortDate(summary.best.date) : '—',
            icon: FiCalendar,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border border-surface-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-gray-800">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">{item.label}</p>
                <p className="text-xl font-black text-gray-950 dark:text-gray-100">{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Revenue & orders</h2>
        <div className="mt-4 h-80">
          {salesData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={salesData}>
                <CartesianGrid strokeDasharray="4 6" vertical={false} />
                <XAxis dataKey="date" tickFormatter={formatRestaurantShortDate} tick={{ fontSize: 11 }} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                <Tooltip
                  labelFormatter={formatRestaurantShortDate}
                  formatter={(v, name) =>
                    name === 'revenue' ? [formatRestaurantCurrency(v), 'Revenue'] : [v, 'Orders']
                  }
                />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="revenue" fill="#8f280022" stroke="#8f2800" />
                <Bar yAxisId="right" dataKey="orders" fill="#059669" barSize={16} radius={[4, 4, 0, 0]} />
                <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8f2800" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center justify-center text-sm text-gray-500">No sales data for this period.</p>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-surface-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">Top menu items</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-100 text-xs uppercase tracking-wide text-gray-500 dark:border-gray-800">
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Qty sold</th>
                <th className="py-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {popularItems.map((row, idx) => (
                <tr key={row._id || idx} className="border-b border-surface-50 dark:border-gray-800">
                  <td className="py-3 pr-4 font-semibold text-gray-900 dark:text-gray-100">{row.name || 'Item'}</td>
                  <td className="py-3 pr-4">{row.totalQuantity || 0}</td>
                  <td className="py-3 font-bold text-primary-800">
                    {formatRestaurantCurrency(row.totalRevenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!popularItems.length && (
            <p className="py-8 text-center text-sm text-gray-500">No item sales in this period.</p>
          )}
        </div>
      </section>
    </div>
  )
}

export default ManagerSalesActivity
