import React, { useEffect, useMemo, useState } from 'react'
import {
  FiBarChart2,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiPercent,
  FiShoppingBag,
  FiTrendingDown,
  FiTrendingUp,
} from 'react-icons/fi'
import { BarChart, Bar, CartesianGrid, ComposedChart, PieChart, Pie, Cell, Line, Legend, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import { EmptyState, FinanceChartBox, FinanceMetric, FinancePageHeader, FinancePanel, FinanceTooltip } from './FinanceUI'

const COLORS = ['#8f2800', '#b64a26', '#756a03', '#a69b02', '#feefa5']
const fmtMoney = (n) => `Rs. ${Number(n || 0).toLocaleString()}`
const pct = (n) => `${Number(n || 0).toLocaleString()}%`
const shortDate = (value) => {
  if (!value) return ''
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
const titleCase = (value) =>
  String(value || 'Unknown')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())

function MixedTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-2xl border border-amber-100 bg-white/95 px-4 py-3 shadow-xl backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="mt-2 space-y-1">
        {payload.map((item) => {
          const isCount = ['orders', 'entries', 'quantity'].includes(item.dataKey)
          return (
            <p key={item.dataKey} className="flex items-center justify-between gap-6 text-sm">
              <span className="text-gray-500 dark:text-gray-400">{item.name || item.dataKey}</span>
              <span className="font-bold text-primary-700 dark:text-primary-300">
                {isCount ? Number(item.value || 0).toLocaleString('en-IN') : fmtMoney(item.value)}
              </span>
            </p>
          )
        })}
      </div>
    </div>
  )
}

function FinanceAccordion({ title, description, open, onToggle, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-amber-50/50 dark:hover:bg-gray-800/50"
      >
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-950 dark:text-gray-100">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>}
        </div>
        <FiChevronDown className={`h-5 w-5 shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-surface-100 p-5 pt-4 dark:border-gray-800">{children}</div>}
    </div>
  )
}

const FinanceDashboard = () => {
  const [range, setRange] = useState('monthly')
  const [summary, setSummary] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [topItems, setTopItems] = useState([])
  const [erp, setErp] = useState(null)
  const [channel, setChannel] = useState([])
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState(() => new Set(['summary']))

  const toggleSection = (key) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

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

  const financeModel = useMemo(() => {
    const profitTrend = analytics?.profitTrend || []
    const peakHours = (analytics?.peakSalesHours || []).map((row) => ({
      ...row,
      hour: `${String(row._id).padStart(2, '0')}:00`,
    }))
    const expenseByCategory = analytics?.expenseByCategory || []
    const taxRefundData = [
      { name: 'Tax collected', amount: Number(summary?.taxCollected || 0) },
      { name: 'Refunds', amount: Number(summary?.refundAmount || 0) },
      { name: 'Net revenue', amount: Number(summary?.netRevenue || 0) },
    ].filter((row) => row.amount > 0)
    const itemChartData = topItems.slice(0, 8).map((item) => ({
      name: item._id?.length > 18 ? `${item._id.slice(0, 18)}...` : item._id || 'Item',
      quantity: Number(item.quantity || 0),
      revenue: Number(item.revenue || 0),
    }))
    const expenseStatusData = analytics?.expenseByStatus || []
    const paymentMethodRing = (analytics?.salesByPaymentMethod || [])
      .map((row) => ({ name: titleCase(row._id), amount: Number(row.amount || 0), orders: Number(row.orders || 0) }))
      .filter((row) => row.amount > 0)
    const channelRing = (channel || [])
      .map((row) => ({ name: titleCase(row._id), amount: Number(row.revenue || 0), orders: Number(row.orders || 0) }))
      .filter((row) => row.amount > 0)
    const expenseCategoryRing = expenseByCategory
      .slice(0, 6)
      .map((row) => ({ name: titleCase(row._id), amount: Number(row.amount || 0), entries: Number(row.entries || 0) }))
      .filter((row) => row.amount > 0)
    const expenseStatusRing = expenseStatusData
      .map((row) => ({ name: titleCase(row._id), amount: Number(row.amount || 0), entries: Number(row.entries || 0) }))
      .filter((row) => row.amount > 0)
    const profitPositive = Number(summary?.netProfit || 0) >= 0
    const totalRevenue = Number(summary?.totalRevenue || 0)
    const netRevenue = Number(summary?.netRevenue || 0)
    const totalExpenses = Number(summary?.totalExpenses || 0)
    const taxCollected = Number(summary?.taxCollected || 0)
    const refundAmount = Number(summary?.refundAmount || 0)
    const totalOrders = Number(summary?.totalOrders || 0)

    return {
      profitTrend,
      peakHours,
      expenseByCategory,
      taxRefundData,
      itemChartData,
      expenseStatusData,
      paymentMethodRing,
      channelRing,
      expenseCategoryRing,
      expenseStatusRing,
      netRevenueRate: totalRevenue > 0 ? Number(((netRevenue / totalRevenue) * 100).toFixed(1)) : 0,
      expenseRatio: netRevenue > 0 ? Number(((totalExpenses / netRevenue) * 100).toFixed(1)) : 0,
      taxRate: totalRevenue > 0 ? Number(((taxCollected / totalRevenue) * 100).toFixed(1)) : 0,
      refundRate: totalRevenue > 0 ? Number(((refundAmount / totalRevenue) * 100).toFixed(1)) : 0,
      revenuePerExpenseEntry: Number(summary?.expenseEntries || 0) > 0 ? netRevenue / Number(summary.expenseEntries) : 0,
      itemsPerOrder: totalOrders > 0 ? Number(summary?.itemCount || 0) / totalOrders : 0,
      profitPositive,
    }
  }, [analytics, summary, topItems])

  const cards = [
    { label: 'Total Revenue', value: fmtMoney(summary?.totalRevenue), icon: FiDollarSign },
    { label: 'Total Orders', value: Number(summary?.totalOrders || 0), icon: FiShoppingBag },
    { label: 'Average Order', value: fmtMoney(summary?.averageOrderValue), icon: FiBarChart2 },
    { label: 'Net Revenue', value: fmtMoney(summary?.netRevenue), icon: FiCalendar },
    { label: 'Expenses', value: fmtMoney(summary?.totalExpenses), sub: `${summary?.expenseEntries || 0} entries`, icon: FiCreditCard, tone: 'warning' },
    { label: 'Net Profit', value: fmtMoney(summary?.netProfit), icon: financeModel.profitPositive ? FiTrendingUp : FiTrendingDown, tone: financeModel.profitPositive ? 'success' : 'danger' },
    { label: 'Profit Margin', value: pct(summary?.profitMarginPercent), icon: FiPercent, tone: financeModel.profitPositive ? 'success' : 'danger' },
    { label: 'Tax / Refunds', value: fmtMoney(summary?.taxCollected), sub: `Refunds ${fmtMoney(summary?.refundAmount)}`, icon: FiFileText, tone: 'neutral' },
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

      <FinanceAccordion
        title="Summary & headline numbers"
        description="Key totals for the selected period, ERP snapshot, channels, and the finance deep dive grid."
        open={openSections.has('summary')}
        onToggle={() => toggleSection('summary')}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((c) => (
              <FinanceMetric key={c.label} label={c.label} value={loading ? '...' : c.value} sub={c.sub} icon={c.icon} tone={c.tone} />
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

          <FinancePanel title="Finance Deep Dive">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                ['Gross revenue', fmtMoney(summary?.totalRevenue)],
                ['Net revenue', fmtMoney(summary?.netRevenue)],
                ['Paid expenses', fmtMoney(summary?.paidExpenses)],
                ['Pending expenses', fmtMoney(summary?.pendingExpenses)],
                ['Items sold', Number(summary?.itemCount || 0).toLocaleString('en-IN')],
                ['Expense entries', Number(summary?.expenseEntries || 0).toLocaleString('en-IN')],
                ['Tax collected', fmtMoney(summary?.taxCollected)],
                ['Refund amount', fmtMoney(summary?.refundAmount)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-amber-100 bg-[#fffaf0] px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
                  <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                  <p className="mt-1 text-xl font-black text-gray-950 dark:text-gray-100">{loading ? '...' : value}</p>
                </div>
              ))}
            </div>
          </FinancePanel>
        </div>
      </FinanceAccordion>

      <FinanceAccordion
        title="Composition, rings & expense mix"
        description="KPI ratios, channel and expense doughnuts, profit trend, and payment mix."
        open={openSections.has('rings')}
        onToggle={() => toggleSection('rings')}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Net revenue rate', pct(financeModel.netRevenueRate), 'Net revenue as a share of gross sales'],
            ['Expense ratio', pct(financeModel.expenseRatio), 'Expenses compared with net revenue'],
            ['Tax share', pct(financeModel.taxRate), 'Tax collected from gross sales'],
            ['Refund share', pct(financeModel.refundRate), 'Refund value from gross sales'],
            ['Revenue per expense entry', fmtMoney(financeModel.revenuePerExpenseEntry), 'Net revenue divided by expense entries'],
            ['Items per order', Number(financeModel.itemsPerOrder || 0).toFixed(2), 'Average quantity sold per order'],
            ['Pending expense value', fmtMoney(summary?.pendingExpenses), 'Expenses still pending or partial'],
            ['Cash discipline', financeModel.expenseRatio <= 60 ? 'Healthy' : 'Watch', 'Simple operating cost signal'],
          ].map(([label, value, helper]) => (
            <div key={label} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
              <p className="text-xs font-black uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
              <p className="mt-2 text-2xl font-black text-gray-950 dark:text-gray-100">{value}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helper}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <FinanceChartBox empty={financeModel.channelRing.length === 0} emptyTitle="No channel ring data yet">
            <div className="mb-3">
              <h3 className="font-bold text-gray-950 dark:text-gray-100">Revenue Channel Ring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue share by QR, dine-in, takeaway, and delivery.</p>
            </div>
            <div className="grid min-h-72 grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_190px]">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={financeModel.channelRing} dataKey="amount" nameKey="name" innerRadius={68} outerRadius={108} paddingAngle={4}>
                      {financeModel.channelRing.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<FinanceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {financeModel.channelRing.map((entry, index) => (
                  <div key={entry.name} className="rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {entry.name}
                      </span>
                      <span className="text-xs text-gray-500">{entry.orders} orders</span>
                    </div>
                    <p className="mt-1 text-sm font-black text-primary-700 dark:text-primary-300">{fmtMoney(entry.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </FinanceChartBox>


          <FinanceChartBox empty={financeModel.profitTrend.length === 0} emptyTitle="No profit trend yet">
            <div className="mb-3">
              <h3 className="font-bold text-gray-950 dark:text-gray-100">Profit trend</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Revenue, expenses and profit per day.</p>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financeModel.profitTrend} margin={{ top: 14, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="_id" tickFormatter={shortDate} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} width={58} />
                  <Tooltip content={<MixedTooltip labelFormatter={shortDate} />} cursor={{ fill: '#fffcf1' }} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#059669" radius={[10, 10, 3, 3]} barSize={26} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[10, 10, 3, 3]} barSize={26} />
                  <Line type="monotone" dataKey="profit" name="Profit" stroke="#8f2800" strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </FinanceChartBox>

          

          <FinanceChartBox empty={financeModel.expenseCategoryRing.length === 0} emptyTitle="No expense category ring data yet">
            <div className="mb-3">
              <h3 className="font-bold text-gray-950 dark:text-gray-100">Expense Category Ring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Top spending categories in the selected period.</p>
            </div>
            <div className="grid min-h-72 grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_190px]">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={financeModel.expenseCategoryRing} dataKey="amount" nameKey="name" innerRadius={68} outerRadius={108} paddingAngle={4}>
                      {financeModel.expenseCategoryRing.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[(index + 2) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<FinanceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {financeModel.expenseCategoryRing.map((entry, index) => (
                  <div key={entry.name} className="rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                        {entry.name}
                      </span>
                      <span className="text-xs text-gray-500">{entry.entries} entries</span>
                    </div>
                    <p className="mt-1 text-sm font-black text-primary-700 dark:text-primary-300">{fmtMoney(entry.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </FinanceChartBox>

          <FinanceChartBox empty={financeModel.expenseStatusRing.length === 0} emptyTitle="No expense status ring data yet">
            <div className="mb-3">
              <h3 className="font-bold text-gray-950 dark:text-gray-100">Expense Status Ring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paid, pending, partial, and cancelled expense value.</p>
            </div>
            <div className="grid min-h-72 grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_190px]">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={financeModel.expenseStatusRing} dataKey="amount" nameKey="name" innerRadius={68} outerRadius={108} paddingAngle={4}>
                      {financeModel.expenseStatusRing.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[(index + 3) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<FinanceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {financeModel.expenseStatusRing.map((entry, index) => (
                  <div key={entry.name} className="rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }} />
                        {entry.name}
                      </span>
                      <span className="text-xs text-gray-500">{entry.entries} entries</span>
                    </div>
                    <p className="mt-1 text-sm font-black text-primary-700 dark:text-primary-300">{fmtMoney(entry.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </FinanceChartBox>
        </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
       <FinanceChartBox empty={financeModel.paymentMethodRing.length === 0} emptyTitle="No payment method ring data yet">
            <div className="mb-3">
              <h3 className="font-bold text-gray-950 dark:text-gray-100">Payment Collection Ring</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Which payment methods are bringing in revenue.</p>
            </div>
            <div className="grid min-h-72 grid-cols-1 items-center gap-4 lg:grid-cols-[1fr_190px]">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={financeModel.paymentMethodRing} dataKey="amount" nameKey="name" innerRadius={68} outerRadius={108} paddingAngle={4}>
                      {financeModel.paymentMethodRing.map((entry, index) => (
                        <Cell key={entry.name} fill={COLORS[(index + 1) % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<FinanceTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {financeModel.paymentMethodRing.map((entry, index) => (
                  <div key={entry.name} className="rounded-xl bg-white px-3 py-2 shadow-sm dark:bg-gray-900">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[(index + 1) % COLORS.length] }} />
                        {entry.name}
                      </span>
                      <span className="text-xs text-gray-500">{entry.orders} orders</span>
                    </div>
                    <p className="mt-1 text-sm font-black text-primary-700 dark:text-primary-300">{fmtMoney(entry.amount)}</p>
                  </div>
                ))}
              </div>
            </div>
          </FinanceChartBox>

        <FinancePanel title="Expense by category">
          <FinanceChartBox empty={financeModel.expenseByCategory.length === 0} emptyTitle="No expense categories yet">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financeModel.expenseByCategory.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 14, left: 26, bottom: 0 }}>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" horizontal={false} />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} />
                  <YAxis type="category" dataKey="_id" tickFormatter={titleCase} axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} width={112} />
                  <Tooltip content={<MixedTooltip />} cursor={{ fill: '#fffcf1' }} />
                  <Bar dataKey="amount" name="Expense" fill="#f97316" radius={[0, 12, 12, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </FinanceChartBox>
        </FinancePanel>
      </div>
      </FinanceAccordion>

      <FinanceAccordion
        title="Trends, timing & top sellers"
        description="Peak hours, revenue trend, category mix, payment bars, and best-selling menu lines."
        open={openSections.has('charts')}
        onToggle={() => toggleSection('charts')}
      >
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <FinancePanel title="Peak sales hours">
          <FinanceChartBox empty={financeModel.peakHours.length === 0} emptyTitle="No hourly sales yet">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={financeModel.peakHours} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <YAxis yAxisId="left" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} width={34} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} width={52} />
                  <Tooltip content={<MixedTooltip />} cursor={{ fill: '#fffcf1' }} />
                  <Bar yAxisId="left" dataKey="orders" name="Orders" fill="#7c3aed" radius={[12, 12, 4, 4]} barSize={30} />
                  <Line yAxisId="right" type="monotone" dataKey="amount" name="Revenue" stroke="#059669" strokeWidth={3} dot={{ r: 4, fill: '#fff' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </FinanceChartBox>
        </FinancePanel>

        <FinancePanel title="Tax and refunds">
          <FinanceChartBox empty={financeModel.taxRefundData.length === 0} emptyTitle="No tax/refund data yet">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={financeModel.taxRefundData} dataKey="amount" nameKey="name" innerRadius={56} outerRadius={92} paddingAngle={4}>
                    {financeModel.taxRefundData.map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<FinanceTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </FinanceChartBox>
        </FinancePanel>

        <FinancePanel title="Expense payment status">
          <FinanceChartBox empty={financeModel.expenseStatusData.length === 0} emptyTitle="No expense payment status yet">
            <div className="space-y-3">
              {financeModel.expenseStatusData.map((row, index) => (
                <div key={row._id || index} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-950">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-gray-950 dark:text-gray-100">{titleCase(row._id)}</span>
                    <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-700 dark:bg-gray-800 dark:text-primary-300">
                      {row.entries} entries
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-black text-primary-700 dark:text-primary-300">{fmtMoney(row.amount)}</p>
                </div>
              ))}
            </div>
          </FinanceChartBox>
        </FinancePanel>
      </div>

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
          {financeModel.itemChartData.length > 0 && (
            <div className="mb-4">
              <FinanceChartBox>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financeModel.itemChartData} layout="vertical" margin={{ top: 8, right: 14, left: 24, bottom: 0 }}>
                      <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 12 }} width={120} />
                      <Tooltip content={<MixedTooltip />} cursor={{ fill: '#fffcf1' }} />
                      <Bar dataKey="quantity" name="Quantity" fill="#059669" radius={[0, 12, 12, 0]} barSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </FinanceChartBox>
            </div>
          )}
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
      </FinanceAccordion>
    </div>
  )
}

export default FinanceDashboard
