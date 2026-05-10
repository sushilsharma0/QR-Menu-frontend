import React, { useState } from 'react'
import { FiActivity, FiCreditCard, FiDollarSign } from 'react-icons/fi'
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import toast from 'react-hot-toast'
import api from '../../../services/api'
import Button from '../../../components/common/Button'
import Input from '../../../components/common/Input'
import { FinanceChartBox, FinanceMetric, FinancePageHeader, FinancePanel, FinanceTooltip, money } from './FinanceUI'

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

  return (
    <div className="space-y-6">
      <FinancePageHeader
        title="Profit & Loss"
        subtitle="Revenue from sales reports minus all expenses (including staff_salary from paid payroll). Pick a date range that includes payroll payment dates."
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <FinanceMetric label="Revenue" value={money(report.revenue)} icon={FiDollarSign} />
          <FinanceMetric label="Expenses" value={money(report.expenses)} icon={FiCreditCard} tone="warning" />
          <FinanceMetric label="Net profit" value={money(report.netProfit)} icon={FiActivity} tone={Number(report.netProfit || 0) >= 0 ? 'success' : 'danger'} />
        </div>
      )}

      <FinancePanel title="Profit trend">
        <FinanceChartBox empty={trends.length === 0} emptyTitle="No P&L reports yet" emptyText="Generate a report to see revenue, expenses and profit trend lines.">
          <div className="h-80">
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
                <Bar dataKey="revenue" name="Revenue" fill="url(#profitRevenueGradient)" radius={[12, 12, 4, 4]} barSize={34} />
                <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#d97706" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} />
                <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#059669" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 7, strokeWidth: 0, fill: '#059669' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </FinanceChartBox>
      </FinancePanel>
    </div>
  )
}

export default ProfitLoss
