import React, { useEffect, useMemo, useState } from 'react'
import { FiBarChart2, FiCalendar, FiDollarSign, FiShoppingBag } from 'react-icons/fi'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Card from '../../../components/common/Card'
import Button from '../../../components/common/Button'

const COLORS = ['#8f2800', '#b64a26', '#756a03', '#a69b02', '#feefa5']

const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-950 dark:text-gray-100">Accounting Dashboard</h1>
        <div className="flex gap-2">
          {['today', 'yesterday', 'weekly', 'monthly', 'yearly'].map((r) => (
            <Button key={r} type="button" variant={range === r ? 'primary' : 'secondary'} onClick={() => setRange(r)}>
              {r}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} title={c.label} icon={c.icon}>
            <p className="text-2xl font-black text-primary-700 dark:text-primary-300">{loading ? '...' : c.value}</p>
          </Card>
        ))}
      </div>

      {erp && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card title="Sales today (ERP)" icon={FiDollarSign}>
            <p className="text-2xl font-black text-primary-700 dark:text-primary-300">{fmtMoney(erp.today?.revenue)}</p>
          </Card>
          <Card title="Expenses today" icon={FiCalendar}>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">{fmtMoney(erp.today?.expenses)}</p>
          </Card>
          <Card title="Profit today" icon={FiBarChart2}>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">{fmtMoney(erp.today?.profit)}</p>
          </Card>
          <Card title="Inventory valuation" icon={FiShoppingBag}>
            <p className="text-2xl font-black text-primary-700 dark:text-primary-300">{fmtMoney(erp.inventoryValuation)}</p>
          </Card>
          <Card title="Best seller (today)" icon={FiShoppingBag}>
            <p className="font-semibold">{erp.bestSellingItem?._id || '—'}</p>
            <p className="text-xs text-gray-500">{erp.bestSellingItem ? fmtMoney(erp.bestSellingItem.revenue) : ''}</p>
          </Card>
          <Card title="Top expense category (today)" icon={FiBarChart2}>
            <p className="font-semibold capitalize">{erp.topExpenseCategory?._id || '—'}</p>
            <p className="text-xs text-gray-500">
              {erp.topExpenseCategory ? fmtMoney(erp.topExpenseCategory.amount) : ''}
            </p>
          </Card>
          <Card title="Monthly revenue" icon={FiDollarSign}>
            <p className="text-2xl font-black">{fmtMoney(erp.monthlyRevenue)}</p>
          </Card>
          <Card title="Monthly growth" icon={FiBarChart2}>
            <p className="text-2xl font-black">{erp.monthlyGrowthPercent != null ? `${erp.monthlyGrowthPercent}%` : '—'}</p>
          </Card>
        </div>
      )}

      {channel?.length > 0 && (
        <Card title="Revenue by channel (selected range)" icon={FiBarChart2}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channel}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#756a03" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Revenue trend (line)" icon={FiBarChart2}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.revenueTrend || []}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#8f2800" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Sales by category (pie)" icon={FiBarChart2}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={analytics?.salesByCategory || []} dataKey="amount" nameKey="_id" outerRadius={100}>
                  {(analytics?.salesByCategory || []).map((entry, index) => (
                    <Cell key={entry._id || index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Payment method (bar)" icon={FiBarChart2}>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.salesByPaymentMethod || []}>
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#b64a26" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Top selling items" icon={FiShoppingBag}>
          <div className="space-y-2">
            {topItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between rounded-xl bg-surface-50 p-3 dark:bg-gray-800">
                <span className="font-semibold">{item._id}</span>
                <span className="text-sm text-gray-500">{item.quantity} qty • {fmtMoney(item.revenue)}</span>
              </div>
            ))}
            {topItems.length === 0 && <p className="text-sm text-gray-500">No sales data in selected period.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default FinanceDashboard
