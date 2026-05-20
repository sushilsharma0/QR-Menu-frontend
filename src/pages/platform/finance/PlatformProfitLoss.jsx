import React, { useMemo, useState } from 'react'
import { FiActivity, FiCreditCard, FiDollarSign, FiPercent, FiTrendingUp } from 'react-icons/fi'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
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

const chartColors = ['#8f2800', '#d97706', '#0f766e', '#2563eb', '#7c3aed', '#dc2626']

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

  const summaryBars = useMemo(() => {
    if (!report) return []
    return [
      { label: 'Revenue', amount: Number(report.revenue || 0), fill: '#8f2800' },
      { label: 'Payroll', amount: Number(report.payrollExpenses || 0), fill: '#d97706' },
      { label: 'Other expenses', amount: Number(report.operatingExpenses || 0), fill: '#2563eb' },
      { label: 'Net profit', amount: Number(report.netProfit || 0), fill: Number(report.netProfit || 0) >= 0 ? '#059669' : '#dc2626' },
    ]
  }, [report])

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
          <>
            <FinanceMetricsGrid>
              <FinanceMetric label="Subscription revenue" value={money(report.revenue)} icon={FiDollarSign} />
              <FinanceMetric label="Total expenses" value={money(report.expenses)} icon={FiCreditCard} tone="warning" />
              <FinanceMetric label="Payroll (auto)" value={money(report.payrollExpenses)} icon={FiCreditCard} tone="neutral" />
              <FinanceMetric label="Operating purchases" value={money(report.operatingExpenses)} icon={FiCreditCard} tone="neutral" />
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

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <FinancePanel title="Period summary">
                <FinanceChartBox empty={!summaryBars.length} emptyTitle="No data" emptyText="Generate a report first.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summaryBars} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="#f1e8dc" strokeDasharray="4 6" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={52} />
                      <Tooltip content={<FinanceTooltip />} />
                      <Bar dataKey="amount" radius={[8, 8, 2, 2]}>
                        {summaryBars.map((entry) => (
                          <Cell key={entry.label} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </FinanceChartBox>
              </FinancePanel>

              <FinancePanel title="Expenses by category">
                <FinanceChartBox empty={!categoryChart.length} emptyTitle="No expenses in range" emptyText="Add expenses or pay payroll in this period.">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryChart} layout="vertical" margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                      <XAxis type="number" tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
                      <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                      <Tooltip content={<FinanceTooltip />} />
                      <Bar dataKey="amount" fill="#d97706" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </FinanceChartBox>
              </FinancePanel>
            </div>

            <FinancePanel title="Report history trend">
              <FinanceChartBox empty={!trends.length} emptyTitle="No history yet" emptyText="Generate reports over time to see trends.">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trends} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 6" vertical={false} />
                    <XAxis
                      dataKey="createdAt"
                      tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} width={52} />
                    <Tooltip content={<FinanceTooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} />} />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#8f2800" radius={[6, 6, 0, 0]} />
                    <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#d97706" strokeWidth={2} />
                    <Line type="monotone" dataKey="netProfit" name="Net profit" stroke="#059669" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </FinanceChartBox>
            </FinancePanel>
          </>
        )}
      </div>
    </PlatformPermissionGate>
  )
}
