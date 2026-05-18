import React, { useMemo, useState } from 'react'
import { FiActivity, FiCreditCard, FiDollarSign, FiPercent, FiRefreshCcw, FiTrendingUp } from 'react-icons/fi'
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ReferenceLine,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import toast from '@utils/toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import {
  FinanceChartBox,
  FinanceMetric,
  FinanceMetricsGrid,
  FinancePageHeader,
  FinancePageShell,
  FinancePanel,
  FinanceTooltip,
  money,
} from './FinanceUI'

const chartColors = ['#8f2800', '#d97706', '#0f766e', '#2563eb', '#dc2626', '#7c3aed']

const ProfitLoss = () => {
  const [from, setFrom] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10))
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10))
  const [report, setReport] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const res = await api.get('/restaurant/finance/profit-loss', { params: { from, to, period: 'custom' } })
      setReport(res.data?.data?.report || null)
      setTrends(res.data?.data?.trends || [])
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const reportCharts = useMemo(() => {
    if (!report) {
      return {
        breakdown: [],
        costMix: [],
        profitStack: [],
        hasBreakdown: false,
        hasCostMix: false,
      }
    }

    const revenue = Number(report.revenue || 0)
    const expenses = Number(report.expenses || 0)
    const taxes = Number(report.taxes || 0)
    const refunds = Number(report.refunds || 0)
    const grossProfit = Number(report.grossProfit || 0)
    const netProfit = Number(report.netProfit || 0)

    const breakdown = [
      { label: 'Revenue', amount: revenue, fill: '#8f2800' },
      { label: 'Expenses', amount: expenses, fill: '#d97706' },
      { label: 'Taxes', amount: taxes, fill: '#2563eb' },
      { label: 'Refunds', amount: refunds, fill: '#dc2626' },
      { label: 'Gross profit', amount: grossProfit, fill: grossProfit >= 0 ? '#0f766e' : '#dc2626' },
      { label: 'Net profit', amount: netProfit, fill: netProfit >= 0 ? '#059669' : '#dc2626' },
    ]

    const costMix = [
      { name: 'Expenses', value: expenses },
      { name: 'Taxes', value: taxes },
      { name: 'Refunds', value: refunds },
      { name: 'Net profit', value: Math.max(netProfit, 0) },
    ].filter((item) => item.value > 0)

    const profitStack = [
      {
        label: 'Selected period',
        revenue,
        expenses,
        taxes,
        refunds,
        grossProfit,
        netProfit,
      },
    ]

    return {
      breakdown,
      costMix,
      profitStack,
      hasBreakdown: breakdown.some((item) => item.amount !== 0),
      hasCostMix: costMix.length > 0,
    }
  }, [report])

  const trendHasMargin = trends.some((item) => Number.isFinite(Number(item.marginPercent)))

  return (
    <FinancePageShell>
      <FinancePageHeader
        title="Profit & Loss"
        subtitle="Revenue from sales reports minus all expenses. Paid payroll posts staff_salary for net pay plus employee and employer EPF. Pick a range that includes payroll payment dates."
      />

      <FinancePanel title="Generate P&L report">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input label="From" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input label="To" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <div className="flex items-end md:col-span-2">
            <Button type="button" loading={loading} onClick={load}>Generate</Button>
          </div>
        </div>
      </FinancePanel>

      {report && (
        <FinanceMetricsGrid>
          <FinanceMetric label="Revenue" value={money(report.revenue)} icon={FiDollarSign} />
          <FinanceMetric label="Expenses" value={money(report.expenses)} icon={FiCreditCard} tone="warning" />
          <FinanceMetric label="Taxes & refunds" value={money(Number(report.taxes || 0) + Number(report.refunds || 0))} icon={FiRefreshCcw} tone="neutral" />
          <FinanceMetric label="Gross profit" value={money(report.grossProfit)} icon={FiTrendingUp} tone={Number(report.grossProfit || 0) >= 0 ? 'success' : 'danger'} />
          <FinanceMetric label="Net profit" value={money(report.netProfit)} icon={FiActivity} tone={Number(report.netProfit || 0) >= 0 ? 'success' : 'danger'} />
          <FinanceMetric label="Profit margin" value={`${Number(report.marginPercent || 0).toFixed(2)}%`} icon={FiPercent} tone={Number(report.marginPercent || 0) >= 0 ? 'success' : 'danger'} />
        </FinanceMetricsGrid>
      )}

      <FinancePanel title="Profit trend detail">
        <FinanceChartBox empty={trends.length === 0} emptyTitle="No P&L reports yet" emptyText="Generate a report to see revenue, expenses and profit trend lines.">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trends} margin={{ top: 14, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="profitRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8f2800" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#b64a26" stopOpacity={0.18} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                <XAxis
                  dataKey="createdAt"
                  tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  dy={8}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} width={58} />
                <Tooltip content={<FinanceTooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />} cursor={{ fill: '#fffcf1' }} />
                <Legend verticalAlign="top" height={32} iconType="circle" />
                <Bar dataKey="revenue" name="Revenue" fill="url(#profitRevenueGradient)" radius={[12, 12, 4, 4]} barSize={34} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#d97706" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#059669' }} />
              </ComposedChart>
            </ResponsiveContainer>
        </FinanceChartBox>
      </FinancePanel>

      <div className="grid grid-cols-1 gap-4 laptop:gap-5 xl:grid-cols-2">
        <FinancePanel title="Selected period breakdown">
          <FinanceChartBox empty={!reportCharts.hasBreakdown} emptyTitle="No period values yet" emptyText="Generate a P&L report to compare revenue, costs, taxes, refunds and profit.">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={reportCharts.breakdown} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={8} interval={0} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} width={58} />
                  <Tooltip content={<FinanceTooltip />} cursor={{ fill: '#fffcf1' }} />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                  <Bar dataKey="amount" name="Amount" radius={[10, 10, 4, 4]} barSize={36}>
                    {reportCharts.breakdown.map((entry) => (
                      <Cell key={entry.label} fill={entry.fill} />
                    ))}
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
          </FinanceChartBox>
        </FinancePanel>

        <FinancePanel title="Revenue allocation">
          <FinanceChartBox empty={!reportCharts.hasCostMix} emptyTitle="No allocation values yet" emptyText="Positive costs and profit will appear here after a report is generated.">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={reportCharts.costMix} dataKey="value" nameKey="name" innerRadius={74} outerRadius={112} paddingAngle={3} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {reportCharts.costMix.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<FinanceTooltip />} />
                  <Legend iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
          </FinanceChartBox>
        </FinancePanel>
      </div>

      <div className="grid grid-cols-1 gap-4 laptop:gap-5 xl:grid-cols-2">
        <FinancePanel title="Profit bridge">
          <FinanceChartBox empty={!reportCharts.hasBreakdown} emptyTitle="No profit bridge yet" emptyText="Generate a P&L report to see how revenue moves through costs into profit." compact>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={reportCharts.profitStack} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `Rs.${Math.round(Number(v || 0) / 1000)}k`} width={58} />
                  <Tooltip content={<FinanceTooltip />} cursor={{ fill: '#fffcf1' }} />
                  <Legend verticalAlign="top" height={32} iconType="circle" />
                  <Bar dataKey="revenue" name="Revenue" fill="#8f2800" radius={[10, 10, 4, 4]} barSize={26} />
                  <Bar dataKey="expenses" name="Expenses" fill="#d97706" radius={[10, 10, 4, 4]} barSize={26} />
                  <Bar dataKey="taxes" name="Taxes" fill="#2563eb" radius={[10, 10, 4, 4]} barSize={26} />
                  <Bar dataKey="refunds" name="Refunds" fill="#dc2626" radius={[10, 10, 4, 4]} barSize={26} />
                  <Line type="monotone" dataKey="netProfit" name="Net profit" stroke="#059669" strokeWidth={3} dot={{ r: 5, fill: '#fff', strokeWidth: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
          </FinanceChartBox>
        </FinancePanel>

        <FinancePanel title="Margin trend">
          <FinanceChartBox empty={!trendHasMargin} emptyTitle="No margin trend yet" emptyText="Generate reports over time to track margin movement." compact>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trends} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="profitMarginGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0f766e" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                  <XAxis
                    dataKey="createdAt"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#6b7280', fontSize: 12 }}
                    dy={8}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={(v) => `${Number(v || 0).toFixed(0)}%`} width={48} />
                  <Tooltip content={<FinanceTooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} valuePrefix="" valueSuffix="%" />} cursor={{ fill: '#fffcf1' }} />
                  <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="marginPercent" name="Margin %" fill="url(#profitMarginGradient)" stroke="#0f766e" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 7, strokeWidth: 0, fill: '#0f766e' }} />
                </ComposedChart>
              </ResponsiveContainer>
          </FinanceChartBox>
        </FinancePanel>
      </div>
    </FinancePageShell>
  )
}

export default ProfitLoss
