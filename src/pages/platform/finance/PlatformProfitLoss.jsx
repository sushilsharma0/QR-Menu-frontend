import React, { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { FiActivity, FiCreditCard, FiDollarSign, FiPercent, FiTrendingUp } from 'react-icons/fi'
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import toast from '@utils/toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import PlatformPermissionGate from '../../../components/platform/PlatformPermissionGate'
import { PlatformPageHeader } from '../../../components/platform/PlatformUI'
import {
  FinanceChartBox,
  FinanceMetric,
  FinanceMetricsGrid,
  FinancePanel,
  FinanceTooltip,
  money,
} from '../../restaurant/finance/FinanceUI'

const CHART_ANIM_MS = 1100
const STAGGER = 0.06

const chartColors = ['#c2410c', '#d97706', '#0d9488', '#2563eb', '#7c3aed', '#dc2626', '#db2777', '#4f46e5']

const CATEGORY_LABELS = {
  staff_salary: 'Staff salary',
  equipment: 'Equipment',
  office_supplies: 'Office supplies',
  rent: 'Rent',
  utilities: 'Utilities',
  internet: 'Internet',
  marketing: 'Marketing',
  software: 'Software',
  travel: 'Travel',
  professional_services: 'Services',
  maintenance: 'Maintenance',
  miscellaneous: 'Other',
}

const summaryGradientIds = {
  Revenue: 'plGradRevenue',
  Payroll: 'plGradPayroll',
  'Other expenses': 'plGradOps',
  'Net profit': 'plGradProfit',
}

function PlatformChartDefs() {
  return (
    <defs>
      <linearGradient id="plGradRevenue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fb923c" stopOpacity={1} />
        <stop offset="100%" stopColor="#9a3412" stopOpacity={0.85} />
      </linearGradient>
      <linearGradient id="plGradPayroll" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fcd34d" stopOpacity={1} />
        <stop offset="100%" stopColor="#b45309" stopOpacity={0.9} />
      </linearGradient>
      <linearGradient id="plGradOps" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#93c5fd" stopOpacity={1} />
        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.85} />
      </linearGradient>
      <linearGradient id="plGradProfit" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
        <stop offset="100%" stopColor="#047857" stopOpacity={0.9} />
      </linearGradient>
      <linearGradient id="plGradProfitNeg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fca5a5" stopOpacity={1} />
        <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.95} />
      </linearGradient>
      <linearGradient id="plAreaRevenue" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ea580c" stopOpacity={0.35} />
        <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
      </linearGradient>
    </defs>
  )
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: STAGGER, delayChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  },
}

export default function PlatformProfitLoss() {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get('/platform/finance/profit-loss', { params: { from, to, period: 'custom' } })
      setReport(res.data?.data?.report || null)
      setTrends(res.data?.data?.trends || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const categoryChart = useMemo(() => {
    const rows = report?.categoryBreakdown || []
    return rows.map((row, i) => ({
      name: CATEGORY_LABELS[row.category] || row.category,
      amount: Number(row.amount || 0),
      fill: chartColors[i % chartColors.length],
    }))
  }, [report])

  const categoryPie = useMemo(() => {
    const total = categoryChart.reduce((s, r) => s + r.amount, 0)
    if (total <= 0) return []
    return categoryChart
      .filter((r) => r.amount > 0)
      .map((r) => ({
        ...r,
        pct: (r.amount / total) * 100,
      }))
  }, [categoryChart])

  const summaryBars = useMemo(() => {
    if (!report) return []
    const net = Number(report.netProfit || 0)
    return [
      { label: 'Revenue', amount: Number(report.revenue || 0), fill: `url(#${summaryGradientIds.Revenue})` },
      { label: 'Payroll', amount: Number(report.payrollExpenses || 0), fill: `url(#${summaryGradientIds.Payroll})` },
      {
        label: 'Other expenses',
        amount: Number(report.operatingExpenses || 0),
        fill: `url(#${summaryGradientIds['Other expenses']})`,
      },
      {
        label: 'Net profit',
        amount: net,
        fill: `url(#${net >= 0 ? summaryGradientIds['Net profit'] : 'plGradProfitNeg'})`,
      },
    ]
  }, [report])

  const reportMotionKey = report ? `${from}|${to}|${report.revenue}|${report.netProfit}` : 'idle'

  return (
    <PlatformPermissionGate permission="manageFinance">
      <div className="space-y-6">
        <PlatformPageHeader
          badge="Finance"
          title="Profit & loss"
          description="Revenue from approved subscription payments minus platform expenses. Payroll salaries post automatically when you mark payroll as paid."
          icon={FiTrendingUp}
        />

        <FinancePanel title="Generate report">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            <div className="flex items-end md:col-span-2">
              <Button type="button" loading={loading} onClick={load}>
                Generate
              </Button>
            </div>
          </div>
        </FinancePanel>

        {report && (
          <motion.div
            key={reportMotionKey}
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <motion.div variants={itemVariants}>
              <FinanceMetricsGrid>
                <FinanceMetric label="Subscription revenue" value={money(report.revenue)} icon={FiDollarSign} />
                <FinanceMetric label="Total expenses" value={money(report.expenses)} icon={FiCreditCard} tone="warning" />
                <FinanceMetric label="Payroll (auto)" value={money(report.payrollExpenses)} icon={FiCreditCard} tone="neutral" />
                <FinanceMetric
                  label="Operating purchases"
                  value={money(report.operatingExpenses)}
                  icon={FiCreditCard}
                  tone="neutral"
                />
                <FinanceMetric
                  label="Net profit"
                  value={money(report.netProfit)}
                  icon={FiActivity}
                  tone={Number(report.netProfit || 0) >= 0 ? 'success' : 'danger'}
                />
                <FinanceMetric
                  label="Margin"
                  value={`${Number(report.marginPercent || 0).toFixed(1)}%`}
                  icon={FiPercent}
                  tone={Number(report.marginPercent || 0) >= 0 ? 'success' : 'danger'}
                />
              </FinanceMetricsGrid>
            </motion.div>

            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <FinancePanel
                title="Period summary"
                className="overflow-hidden border-surface-200/80 shadow-md ring-1 ring-primary-900/5 dark:border-gray-800 dark:ring-white/5"
              >
                <p className="-mt-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Revenue vs cost stack for the selected range — animated on each generate.
                </p>
                <FinanceChartBox empty={!summaryBars.length} emptyTitle="No data" emptyText="Generate a report first.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryBars} margin={{ top: 16, right: 16, left: 4, bottom: 8 }}>
                      <PlatformChartDefs />
                      <CartesianGrid strokeDasharray="5 8" stroke="rgb(148 163 184 / 0.25)" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'rgb(100 116 139)' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                        width={52}
                        tick={{ fontSize: 11, fill: 'rgb(100 116 139)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgb(251 146 60 / 0.06)' }}
                        content={<FinanceTooltip />}
                        animationDuration={200}
                      />
                      <Bar dataKey="amount" radius={[10, 10, 4, 4]} maxBarSize={56} animationDuration={CHART_ANIM_MS}>
                        {summaryBars.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </FinanceChartBox>
              </FinancePanel>

              <FinancePanel
                title="Expense mix"
                className="overflow-hidden border-surface-200/80 shadow-md ring-1 ring-primary-900/5 dark:border-gray-800 dark:ring-white/5"
              >
                <p className="-mt-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Share of each category — donut view with motion-friendly segments.
                </p>
                <FinanceChartBox
                  empty={!categoryPie.length}
                  emptyTitle="No expenses in range"
                  emptyText="Add expenses or pay payroll in this period."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <Pie
                        data={categoryPie}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="52%"
                        outerRadius="78%"
                        paddingAngle={2}
                        stroke="rgb(255 255 255 / 0.85)"
                        strokeWidth={2}
                        animationBegin={120}
                        animationDuration={CHART_ANIM_MS}
                        animationEasing="ease-out"
                      >
                        {categoryPie.map((entry, i) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<FinanceTooltip />} animationDuration={200} />
                      <Legend
                        verticalAlign="bottom"
                        height={28}
                        formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </FinanceChartBox>
              </FinancePanel>
            </motion.div>

            <motion.div variants={itemVariants}>
              <FinancePanel
                title="Expenses by category"
                className="overflow-hidden border-surface-200/80 shadow-md ring-1 ring-primary-900/5 dark:border-gray-800 dark:ring-white/5"
              >
                <FinanceChartBox empty={!categoryChart.length} emptyTitle="No expenses in range" emptyText="Add expenses or pay payroll in this period.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChart} layout="vertical" margin={{ top: 8, right: 16, left: 4, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="4 6" stroke="rgb(148 163 184 / 0.2)" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'rgb(59 130 246 / 0.06)' }} content={<FinanceTooltip />} />
                      <Bar dataKey="amount" radius={[0, 10, 10, 0]} maxBarSize={22} animationDuration={CHART_ANIM_MS} animationBegin={80}>
                        {categoryChart.map((entry, i) => (
                          <Cell key={entry.name} fill={chartColors[i % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </FinanceChartBox>
              </FinancePanel>
            </motion.div>

            <motion.div variants={itemVariants}>
              <FinancePanel
                title="Report history trend"
                className="overflow-hidden border-surface-200/80 shadow-md ring-1 ring-primary-900/5 dark:border-gray-800 dark:ring-white/5"
              >
                <p className="-mt-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
                  Saved runs over time — shaded revenue and smoothed profit curve.
                </p>
                <FinanceChartBox
                  empty={!trends.length}
                  emptyTitle="No history yet"
                  emptyText="Generate reports over time to see trends."
                >
                  <div className="finance-chart-area--hero">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={trends} margin={{ top: 20, right: 20, left: 4, bottom: 8 }}>
                        <PlatformChartDefs />
                        <CartesianGrid strokeDasharray="5 8" stroke="rgb(148 163 184 / 0.22)" vertical={false} />
                        <XAxis
                          dataKey="createdAt"
                          tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                          width={56}
                          tick={{ fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          content={<FinanceTooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />}
                          animationDuration={200}
                        />
                        <Legend wrapperStyle={{ paddingTop: 8 }} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          name="Revenue"
                          stroke="#ea580c"
                          strokeWidth={2}
                          fill="url(#plAreaRevenue)"
                          fillOpacity={1}
                          animationDuration={CHART_ANIM_MS + 300}
                        />
                        <Line
                          type="monotone"
                          dataKey="expenses"
                          name="Expenses"
                          stroke="#ca8a04"
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 5 }}
                          animationDuration={CHART_ANIM_MS + 200}
                        />
                        <Line
                          type="monotone"
                          dataKey="netProfit"
                          name="Net profit"
                          stroke="#059669"
                          strokeWidth={3}
                          dot={{ r: 3, strokeWidth: 2, fill: '#fff' }}
                          activeDot={{ r: 6 }}
                          animationDuration={CHART_ANIM_MS + 400}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </FinanceChartBox>
              </FinancePanel>
            </motion.div>
          </motion.div>
        )}
      </div>
    </PlatformPermissionGate>
  )
}
