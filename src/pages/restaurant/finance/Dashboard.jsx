import React, { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiCalendar, FiDollarSign, FiShoppingBag } from 'react-icons/fi'
import { BarChart, Bar, CartesianGrid, ComposedChart, PieChart, Pie, Cell, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import { EmptyState, FinanceChartBox, FinanceMetric, FinancePageHeader, FinancePanel, FinanceTooltip } from './FinanceUI'

const COLORS = ['#8f2800', '#b64a26', '#756a03', '#a69b02', '#feefa5']
const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`
const shortDate = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const FinanceDashboard = () => {
  const [range, setRange] = useState('monthly')
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [topItems, setTopItems] = useState([])
  const [erp, setErp] = useState(null)
  const [channel, setChannel] = useState([])
  const [loading, setLoading] = useState(true)

  const query = useMemo(() => {
    const now = new Date()
    const from = new Date(now)
    if (range === 'today') from.setHours(0, 0, 0, 0)
    else if (range === 'yesterday') {
      from.setDate(from.getDate() - 1)
      from.setHours(0, 0, 0, 0)
      now.setDate(now.getDate() - 1)
      now.setHours(23, 59, 59, 999)
    } else if (range === 'weekly') from.setDate(from.getDate() - 7)
    else if (range === 'yearly') from.setFullYear(from.getFullYear() - 1)
    else from.setMonth(from.getMonth() - 1)
    return { from: from.toISOString(), to: now.toISOString() }
  }, [range])

  const load = async () => {
    try {
      setLoading(true)
      const [salesRes, analyticsRes, topRes, erpRes, chRes] = await Promise.all([
        api.get('/restaurant/finance/sales', { params: query }),
        api.get('/restaurant/finance/sales/analytics', { params: query }),
        api.get('/restaurant/finance/sales/top-items', { params: query }),
        api.get('/restaurant/finance/erp-dashboard').catch(() => ({ data: {} })),
        api.get('/restaurant/finance/revenue-by-channel', { params: query }).catch(() => ({ data: {} })),
      ])
      setSummary(salesRes.data.data)
      setAnalytics(analyticsRes.data.data)
      setTopItems(topRes.data.data || [])
      setErp(erpRes.data?.data || null)
      setChannel(chRes.data?.data || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to load finance dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [range])

  const cards = [
    { label: 'Total Revenue', value: fmtMoney(summary?.totalRevenue), icon: FiDollarSign },
    { label: 'Total Orders', value: Number(summary?.totalOrders || 0), icon: FiShoppingBag },
    { label: 'Average Order', value: fmtMoney(summary?.averageOrderValue), icon: FiBarChart2 },
    { label: 'Net Revenue', value: fmtMoney(summary?.netRevenue), icon: FiCalendar },
  ]

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Accounting Dashboard"
        subtitle="Track revenue, orders, operating expenses, inventory value and sales performance from one finance workspace."
        actions={['today', 'yesterday', 'weekly', 'monthly', 'yearly'].map((r) => (
          <Button key={r} type="button" variant={range === r ? 'primary' : 'secondary'} onClick={() => setRange(r)}>
            {r}
          </Button>
        ))}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <FinanceMetric key={c.label} label={c.label} value={loading ? '...' : c.value} icon={c.icon} />
        ))}
      </div>

      {erp && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <FinanceMetric label="Sales today (ERP)" value={fmtMoney(erp.today?.revenue)} icon={FiDollarSign} />
          <FinanceMetric label="Expenses today" value={fmtMoney(erp.today?.expenses)} icon={FiCalendar} tone="warning" />
          <FinanceMetric label="Profit today" value={fmtMoney(erp.today?.profit)} icon={FiBarChart2} tone={Number(erp.today?.profit || 0) >= 0 ? 'success' : 'danger'} />
          <FinanceMetric label="Inventory valuation" value={fmtMoney(erp.inventoryValuation)} icon={FiShoppingBag} />
          <FinanceMetric label="Best seller today" value={erp.bestSellingItem?._id || '-'} sub={erp.bestSellingItem ? fmtMoney(erp.bestSellingItem.revenue) : ''} icon={FiShoppingBag} tone="neutral" />
          <FinanceMetric label="Top expense category" value={erp.topExpenseCategory?._id || '-'} sub={erp.topExpenseCategory ? fmtMoney(erp.topExpenseCategory.amount) : ''} icon={FiBarChart2} tone="warning" />
          <FinanceMetric label="Monthly revenue" value={fmtMoney(erp.monthlyRevenue)} icon={FiDollarSign} />
          <FinanceMetric label="Monthly growth" value={erp.monthlyGrowthPercent != null ? `${erp.monthlyGrowthPercent}%` : '-'} icon={FiBarChart2} tone="success" />
        </div>
      )}

      {channel?.length > 0 && (
        <FinancePanel title="Revenue by channel">
          <FinanceChartBox>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channel} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="channelRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} width={58} />
                  <Tooltip content={<FinanceTooltip />} cursor={{ fill: '#fffcf1' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="url(#channelRevenueGradient)" radius={[14, 14, 5, 5]} barSize={46} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FinanceChartBox>
        </FinancePanel>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <FinancePanel title="Revenue trend">
          <FinanceChartBox empty={(analytics?.revenueTrend || []).length === 0}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analytics?.revenueTrend || []} margin={{ top: 14, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="financeRevenueBars" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8f2800" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#b64a26" stopOpacity={0.18} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="_id" tickFormatter={shortDate} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} width={58} />
                  <Tooltip content={<FinanceTooltip labelFormatter={shortDate} />} cursor={{ fill: '#fffcf1' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="url(#financeRevenueBars)" radius={[12, 12, 4, 4]} barSize={34} />
                  <Line type="monotone" dataKey="orders" name="Orders" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#059669' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </FinanceChartBox>
        </FinancePanel>

        <FinancePanel title="Sales by category">
          <FinanceChartBox empty={(analytics?.salesByCategory || []).length === 0}>
            <div className="grid min-h-80 grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_180px]">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics?.salesByCategory || []} dataKey="amount" nameKey="_id" innerRadius={62} outerRadius={104} paddingAngle={4}>
                      {(analytics?.salesByCategory || []).map((entry, index) => (
                        <Cell key={entry._id || index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<FinanceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {(analytics?.salesByCategory || []).slice(0, 5).map((entry, index) => (
                  <div key={entry._id || index} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 shadow-sm">
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      {entry._id || 'Category'}
                    </span>
                    <span className="text-sm font-bold text-primary-700">{fmtMoney(entry.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          </FinanceChartBox>
        </FinancePanel>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <FinancePanel title="Payment method">
          <FinanceChartBox empty={(analytics?.salesByPaymentMethod || []).length === 0}>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.salesByPaymentMethod || []} margin={{ top: 14, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="paymentMethodGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0.25} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} width={58} />
                  <Tooltip content={<FinanceTooltip />} cursor={{ fill: '#fffcf1' }} />
                  <Bar dataKey="amount" name="Amount" fill="url(#paymentMethodGradient)" radius={[14, 14, 5, 5]} barSize={46} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FinanceChartBox>
        </FinancePanel>

        <FinancePanel title="Top selling items">
          <div className="space-y-2">
            {topItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-xl border border-surface-200 bg-surface-50 p-3 dark:border-gray-800 dark:bg-gray-950">
                <span className="font-semibold">{item._id}</span>
                <span className="text-sm text-gray-500">{item.quantity} qty | {fmtMoney(item.revenue)}</span>
              </div>
            ))}
            {topItems.length === 0 && <EmptyState>No sales data in selected period.</EmptyState>}
          </div>
        </FinancePanel>
      </div>
    </div>
  )
}

export default FinanceDashboard
